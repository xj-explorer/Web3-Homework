package main

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"os"
	"sync"
	"time"

	Counter "counter/counter"

	"github.com/ethereum/go-ethereum/accounts/abi/bind"
	"github.com/ethereum/go-ethereum/event"
)

// EventStatus 表示事件的处理状态
type EventStatus int

const (
	EventStatusPending    EventStatus = iota // 待处理
	EventStatusProcessing                    // 处理中
	EventStatusProcessed                     // 已处理
	EventStatusFailed                        // 处理失败
)

// EventRecord 表示存储的事件记录
type EventRecord struct {
	TxHash      string      `json:"tx_hash"`
	BlockNumber uint64      `json:"block_number"`
	EventData   interface{} `json:"event_data"`
	Status      EventStatus `json:"status"`
	RetryCount  int         `json:"retry_count"`
	LastRetry   time.Time   `json:"last_retry"`
}

// EventHandler 提供可靠的事件处理机制
type EventHandler struct {
	instance          *Counter.Counter                              // Counter合约实例
	client            interface{}                                   // 以太坊客户端实例
	eventDB           map[string]*EventRecord                       // 简单的内存数据库，可以替换为实际数据库
	eventDBMutex      sync.RWMutex                                  // 用于保护eventDB的读写锁
	retryInterval     time.Duration                                 // 事件处理失败后的重试间隔
	maxRetryCount     int                                           // 事件处理失败后的最大重试次数
	dbFilePath        string                                        // 事件存储文件的路径
	isWebSocketClient bool                                          // 标记是否使用WebSocket客户端
	onEventProcessed  func(event *Counter.CounterChangeCount) error // 事件处理回调函数
	onReconnect       func() error                                  // 客户端重连回调函数
}

// NewEventHandler 创建新的事件处理器
func NewEventHandler(
	instance *Counter.Counter,
	client interface{},
	isWebSocketClient bool,
	onEventProcessed func(event *Counter.CounterChangeCount) error,
	onReconnect func() error,
) *EventHandler {
	handler := &EventHandler{
		instance:          instance,
		client:            client,
		eventDB:           make(map[string]*EventRecord),
		retryInterval:     5 * time.Second,
		maxRetryCount:     3,
		dbFilePath:        "event_store.json",
		isWebSocketClient: isWebSocketClient,
		onEventProcessed:  onEventProcessed,
		onReconnect:       onReconnect,
	}

	handler.loadEventStore()
	go handler.startRetryLoop()

	return handler
}

// StartListening 开始监听事件
func (h *EventHandler) StartListening() {
	if h.isWebSocketClient {
		h.startWebSocketListening()
	} else {
		h.startPollingListening()
	}
}

// startWebSocketListening 使用WebSocket连接监听事件
func (h *EventHandler) startWebSocketListening() {
	go func() {
		for {
			ctx, cancel := context.WithCancel(context.Background())
			eventChan := make(chan *Counter.CounterChangeCount, 100) // 使用带缓冲的通道
			watchOpts := &bind.WatchOpts{Context: ctx}

			log.Println("开始使用WebSocket实时订阅changeCount事件...")
			sub, err := h.instance.WatchChangeCount(watchOpts, eventChan)
			if err != nil {
				log.Printf("订阅事件错误: %v, 尝试重新订阅...", err)
				cancel()
				time.Sleep(2 * time.Second)
				if h.onReconnect != nil { // 判断函数是否存在
					if err := h.onReconnect(); err != nil {
						log.Printf("重连失败: %v", err)
					}
				}
				continue
			}

			// 处理接收到的事件
			h.handleEventSubscription(ctx, cancel, sub, eventChan)
		}
	}()
}

// startPollingListening 使用轮询方式监听事件
func (h *EventHandler) startPollingListening() {
	go func() {
		log.Println("开始使用轮询方式监听changeCount事件...")
		var lastBlock uint64 = 0

		for {
			filterOpts := &bind.FilterOpts{
				Start:   lastBlock,
				End:     nil,
				Context: context.Background(),
			}

			iterator, err := h.instance.FilterChangeCount(filterOpts)
			if err != nil {
				log.Printf("过滤事件错误: %v, 稍后重试...", err)
				time.Sleep(5 * time.Second)
				continue
			}

			var maxBlockNumber uint64 = lastBlock

			for iterator.Next() {
				event := iterator.Event

				// 只处理新区块中的事件，避免重复处理
				if event.Raw.BlockNumber > lastBlock {
					h.saveAndProcessEvent(event)
				}

				// 跟踪最大区块号
				if event.Raw.BlockNumber > maxBlockNumber {
					maxBlockNumber = event.Raw.BlockNumber
				}
			}

			// 更新lastBlock为本次轮询中找到的最大区块号
			lastBlock = maxBlockNumber

			iterator.Close()

			// 等待一段时间后再次查询
			time.Sleep(5 * time.Second)
		}
	}()
}

// handleEventSubscription 处理事件订阅
func (h *EventHandler) handleEventSubscription(
	ctx context.Context,
	cancel context.CancelFunc,
	sub event.Subscription,
	eventChan chan *Counter.CounterChangeCount,
) {
	defer func() {
		sub.Unsubscribe()
		cancel()
	}()

	for {
		select {
		case event := <-eventChan:
			// 保存并处理事件
			h.saveAndProcessEvent(event)
		case err := <-sub.Err():
			log.Printf("订阅错误: %v, 准备重新订阅...", err)
			return
		case <-ctx.Done():
			log.Println("事件监听已取消")
			return
		}
	}
}

// saveAndProcessEvent 保存并处理事件
func (h *EventHandler) saveAndProcessEvent(event *Counter.CounterChangeCount) {
	txHash := event.Raw.TxHash.Hex()

	// 检查事件是否已经处理过
	h.eventDBMutex.RLock()
	if record, exists := h.eventDB[txHash]; exists {
		if record.Status == EventStatusProcessed {
			h.eventDBMutex.RUnlock()
			log.Printf("事件已处理，跳过: %s", txHash)
			return
		}
	}
	h.eventDBMutex.RUnlock()

	// 保存事件
	h.eventDBMutex.Lock()
	h.eventDB[txHash] = &EventRecord{
		TxHash:      txHash,
		BlockNumber: event.Raw.BlockNumber,
		EventData:   event,
		Status:      EventStatusPending,
		RetryCount:  0,
		LastRetry:   time.Now(),
	}
	h.eventDBMutex.Unlock()

	// 保存到文件
	h.saveEventStore()

	// 异步处理事件
	go h.processEvent(txHash, event)
}

// processEvent 处理单个事件
func (h *EventHandler) processEvent(txHash string, event *Counter.CounterChangeCount) {
	// 更新状态为处理中
	h.eventDBMutex.Lock()
	record := h.eventDB[txHash]
	record.Status = EventStatusProcessing
	record.LastRetry = time.Now()
	h.eventDBMutex.Unlock()
	h.saveEventStore()

	// 调用用户定义的处理函数
	var processErr error
	if h.onEventProcessed != nil {
		processErr = h.onEventProcessed(event)
	} else {
		// 默认处理逻辑
		fmt.Printf("监听到最新changeCount事件:\n")
		fmt.Printf("  Action: %s\n", event.Action)
		fmt.Printf("  By: %s\n", event.By.String())
		fmt.Printf("  NewCount: %s\n", event.NewCount.String())
		fmt.Printf("  TxHash: %s\n\n", event.Raw.TxHash.Hex())
	}

	// 更新处理结果
	h.eventDBMutex.Lock()
	if processErr != nil {
		record.Status = EventStatusFailed
		record.RetryCount++
		log.Printf("处理事件失败 %s: %v, 重试次数: %d", txHash, processErr, record.RetryCount)
	} else {
		record.Status = EventStatusProcessed
		log.Printf("事件处理成功: %s", txHash)
	}
	h.eventDBMutex.Unlock()
	h.saveEventStore()
}

// startRetryLoop 启动重试循环，处理失败的事件
func (h *EventHandler) startRetryLoop() {
	for {
		time.Sleep(h.retryInterval)
		h.retryFailedEvents()
	}
}

// retryFailedEvents 重试处理失败的事件
func (h *EventHandler) retryFailedEvents() {
	h.eventDBMutex.RLock()
	// 收集需要重试的事件
	var toRetry []string
	for txHash, record := range h.eventDB {
		if record.Status == EventStatusFailed && record.RetryCount < h.maxRetryCount {
			// 检查是否可以重试（至少间隔一段时间）
			if time.Since(record.LastRetry) >= h.retryInterval {
				toRetry = append(toRetry, txHash)
			}
		}
	}
	h.eventDBMutex.RUnlock()

	// 重试事件
	for _, txHash := range toRetry {
		h.eventDBMutex.RLock()
		record := h.eventDB[txHash]
		eventData, ok := record.EventData.(*Counter.CounterChangeCount)
		h.eventDBMutex.RUnlock()

		if ok {
			go h.processEvent(txHash, eventData)
		}
	}
}

// saveEventStore 将事件存储保存到文件
func (h *EventHandler) saveEventStore() {
	h.eventDBMutex.RLock()
	defer h.eventDBMutex.RUnlock()

	file, err := os.Create(h.dbFilePath)
	if err != nil {
		log.Printf("无法创建事件存储文件: %v", err)
		return
	}
	defer file.Close()

	encoder := json.NewEncoder(file)
	if err := encoder.Encode(h.eventDB); err != nil {
		log.Printf("保存事件存储失败: %v", err)
	}
}

// loadEventStore 从文件加载事件存储
func (h *EventHandler) loadEventStore() {
	file, err := os.Open(h.dbFilePath)
	if errors.Is(err, os.ErrNotExist) {
		// 文件不存在，创建新的
		log.Println("事件存储文件不存在，将创建新的")
		h.saveEventStore()
		return
	}
	if err != nil {
		log.Printf("打开事件存储文件失败: %v", err)
		return
	}
	defer file.Close()

	h.eventDBMutex.Lock()
	defer h.eventDBMutex.Unlock()

	decoder := json.NewDecoder(file)
	if err := decoder.Decode(&h.eventDB); err != nil {
		log.Printf("加载事件存储失败: %v", err)
		h.eventDB = make(map[string]*EventRecord) // 重置为新的映射
	}

	// 重新处理未完成的事件
	for txHash, record := range h.eventDB {
		if record.Status == EventStatusPending || record.Status == EventStatusProcessing {
			// 将处理中状态的事件标记为失败，以便重试
			record.Status = EventStatusFailed
			record.RetryCount++
			log.Printf("发现未完成的事件，将重试: %s", txHash)
		}
	}
}
