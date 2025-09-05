package main

import (
	"context"
	"crypto/ecdsa"
	"fmt"
	"log"
	"math/big"
	"time"

	Counter "counter/counter" // 别名导入，使用首字母大写的包名

	"github.com/ethereum/go-ethereum/accounts/abi/bind"
	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/core/types"
	"github.com/ethereum/go-ethereum/crypto"
	"github.com/ethereum/go-ethereum/ethclient"
)

func main() {
	// 连接到Sepolia测试网络（HTTP端点，用于交易和合约调用）
	client, err := ethclient.Dial("https://sepolia.infura.io/v3/1ea13488a02d481c8663b068c0d6fa35")
	if err != nil {
		log.Fatalf("Failed to connect to the Ethereum client: %v", err)
	}

	// 替换为已部署的合约地址
	contractAddress := common.HexToAddress("0x42c3e45FF2E9AF12F21f5FEF6F7B874aDB9eBeBc")
	// 实例化合约
	instance, err := Counter.NewCounter(contractAddress, client)
	if err != nil {
		log.Fatalf("Failed to instantiate a Counter contract: %v", err)
	}

	// 创建事件处理器，避免事件漏处理或重复处理
	eventHandler := setupEventHandler(instance, client, contractAddress)

	// 开始监听事件
	eventHandler.StartListening()

	// 调用合约函数
	callContractFunction(client, instance)

	// 保持程序运行以继续监听事件
	// 打印提示信息，可以通过按下 Ctrl+C 组合键来停止程序运行，进而停止监听事件
	fmt.Println("按Ctrl+C停止监听...")
	// 使用 select 语句且不提供任何 case，这会使当前 goroutine 永久阻塞
	// 因为没有可执行的 case，程序会一直处于等待状态，从而保持监听事件的 goroutine 持续运行
	// 只有当用户手动中断程序（如按下 Ctrl+C）时，程序才会终止
	select {}

}

// 合约函数调用
func callContractFunction(client *ethclient.Client, instance *Counter.Counter) {
	// 替换为你的私钥
	privateKey, err := crypto.HexToECDSA("5ed85e0536a6d5eec133290546d2fc6e98e5d80bacafe1aceb27c5e681fd581b")
	if err != nil {
		log.Fatalf("Failed to parse private key: %v", err)
	}

	// 获取公钥地址
	publicKey := privateKey.Public().(*ecdsa.PublicKey)
	fromAddress := crypto.PubkeyToAddress(*publicKey)

	// 设置交易选项
	nonce, err := client.PendingNonceAt(context.Background(), fromAddress)
	if err != nil {
		log.Fatalf("Failed to get pending nonce: %v", err)
	}

	gasPrice, err := client.SuggestGasPrice(context.Background())
	if err != nil {
		log.Fatalf("Failed to suggest gas price: %v", err)
	}

	// 获取链ID (Sepolia测试网络的链ID是11155111)
	chainID, err := client.ChainID(context.Background())
	if err != nil {
		log.Fatalf("Failed to get chain ID: %v", err)
	}

	// 创建交易签名器
	auth, err := bind.NewKeyedTransactorWithChainID(privateKey, chainID)
	if err != nil {
		log.Fatalf("Failed to create transactor: %v", err)
	}
	auth.Nonce = big.NewInt(int64(nonce))
	auth.Value = big.NewInt(0)     // 不发送以太币
	auth.GasLimit = uint64(300000) // 设置足够的gas限制
	auth.GasPrice = gasPrice

	// 调用increment方法
	fmt.Println("Calling increment method...")
	tx, err := instance.Increment(auth)
	if err != nil {
		log.Fatalf("Failed to call increment method: %v", err)
	}

	fmt.Printf("Transaction hash: %s\n", tx.Hash().Hex())

	_, err = waitForReceipt(client, tx.Hash())
	if err != nil {
		log.Fatal(err)
	}

	// 读取计数器值
	count, err := instance.GetCount(&bind.CallOpts{Context: context.Background()})
	if err != nil {
		log.Fatalf("Failed to call getCount method: %v", err)
	}

	fmt.Printf("Current count: %d\n", count)
}

// 监听Counter合约的changeCount事件并打印最新触发的事件结果（使用轮询方式，作为备用方案）
func listenChangeCountEvent(instance *Counter.Counter) {
	fmt.Println("开始使用轮询方式监听changeCount事件...")

	// 在goroutine中以轮询方式查询最新事件
	go func() {
		var lastBlock uint64 = 0
		for {
			// 创建新的过滤选项，每次轮询都从最后处理的区块开始查询
			filterOpts := &bind.FilterOpts{
				Start:   lastBlock, // 从最后处理的区块开始
				End:     nil,       // 不设置结束区块，查询到最新区块
				Context: context.Background(),
			}

			// 查询事件
			iterator, err := instance.FilterChangeCount(filterOpts)
			if err != nil {
				log.Printf("过滤事件错误: %v\n", err)
				// 等待一段时间后重试
				time.Sleep(3 * time.Second)
				continue
			}

			// 重置最大区块号跟踪变量，用于本次轮询
			var maxBlockNumber uint64 = lastBlock

			// 遍历查询到的事件
			for iterator.Next() {
				event := iterator.Event
				// 只处理新区块中的事件
				if event.Raw.BlockNumber > lastBlock {
					fmt.Printf("监听到最新changeCount事件:\n")
					fmt.Printf("  Action: %s\n", event.Action)
					fmt.Printf("  By: %s\n", event.By.String())
					fmt.Printf("  NewCount: %s\n", event.NewCount.String())
					fmt.Printf("  TxHash: %s\n\n", event.Raw.TxHash.Hex())
				}

				// 跟踪最大区块号
				if event.Raw.BlockNumber > maxBlockNumber {
					maxBlockNumber = event.Raw.BlockNumber
				}
			}

			// 更新lastBlock为本次轮询中找到的最大区块号
			lastBlock = maxBlockNumber

			// 关闭迭代器
			iterator.Close()

			// 等待一段时间后再次查询
			time.Sleep(2 * time.Second)
		}
	}()
}

// 监听Counter合约的changeCount事件并打印最新触发的事件结果（使用WebSocket实时订阅）
func listenChangeCountEventWithWS(instance *Counter.Counter, client *ethclient.Client) {
	fmt.Println("开始使用WebSocket实时订阅changeCount事件...")

	// 创建上下文，用于取消订阅
	ctx, cancel := context.WithCancel(context.Background())

	// 在goroutine中监听事件
	go func() {
		// 创建事件通道
		eventChan := make(chan *Counter.CounterChangeCount)

		// 创建订阅选项
		watchOpts := &bind.WatchOpts{
			Context: ctx,
		}

		// 订阅事件
		sub, err := instance.WatchChangeCount(watchOpts, eventChan)
		if err != nil {
			log.Printf("Failed to watch changeCount event: %v\n", err)
			cancel()
			return
		}

		// 监听完成时取消订阅和关闭通道
		defer func() {
			sub.Unsubscribe()
			close(eventChan)
			cancel()
		}()

		// 处理接收到的事件
		for {
			select {
			case event := <-eventChan:
				// 打印最新事件
				fmt.Printf("监听到最新changeCount事件:\n")
				fmt.Printf("  Action: %s\n", event.Action)
				fmt.Printf("  By: %s\n", event.By.String())
				fmt.Printf("  NewCount: %s\n", event.NewCount.String())
				fmt.Printf("  TxHash: %s\n\n", event.Raw.TxHash.Hex())
			case err := <-sub.Err():
				log.Printf("订阅错误: %v\n", err)
				// 如果发生错误，可以在这里重新订阅或退出
				return
			}
		}
	}()
}

// setupEventHandler 创建并配置事件处理器
func setupEventHandler(instance *Counter.Counter, client *ethclient.Client, contractAddress common.Address) *EventHandler {
	// 尝试连接WebSocket客户端
	eventsClient, wsErr := ethclient.Dial("wss://sepolia.infura.io/ws/v3/1ea13488a02d481c8663b068c0d6fa35")

	var eventInstance *Counter.Counter
	var isWebSocket bool

	if wsErr != nil {
		// WebSocket连接失败，使用HTTP客户端
		log.Printf("WebSocket客户端连接失败: %v，使用HTTP客户端进行轮询", wsErr)
		eventInstance = instance
		isWebSocket = false
	} else {
		// 使用WebSocket客户端创建专门用于事件监听的合约实例
		eventsInstance, err := Counter.NewCounter(contractAddress, eventsClient)
		if err != nil {
			log.Printf("使用WebSocket创建合约实例失败: %v，回退到HTTP客户端", err)
			eventInstance = instance
			isWebSocket = false
		} else {
			log.Println("使用WebSocket客户端进行事件监听")
			eventInstance = eventsInstance
			isWebSocket = true
		}
	}

	// 定义事件处理函数
	onEventProcessed := func(event *Counter.CounterChangeCount) error {
		// 这里是事件处理逻辑
		fmt.Printf("监听到最新changeCount事件:\n")
		fmt.Printf("  Action: %s\n", event.Action)
		fmt.Printf("  By: %s\n", event.By.String())
		fmt.Printf("  NewCount: %s\n", event.NewCount.String())
		fmt.Printf("  TxHash: %s\n\n", event.Raw.TxHash.Hex())
		return nil
	}

	// 定义重连函数
	onReconnect := func() error {
		// 当WebSocket连接断开时，实现真实的重连逻辑
		log.Println("尝试重新连接WebSocket...")

		// 重连次数限制
		const maxRetries = 5
		// 指数退避时间，用于控制每次重连失败后等待的时间。
		// 初始退避时间设置为 1 秒，后续每次重连失败时，该时间会成倍增加，
		// 以避免短时间内频繁尝试重连给服务器造成过大压力。
		retryInterval := time.Second

		for attempt := 1; attempt <= maxRetries; attempt++ {
			log.Printf("重连尝试 #%d/%d...", attempt, maxRetries)

			// 尝试创建新的WebSocket客户端连接
			// 在go-ethereum中，WebSocket连接通过Dial方法实现
			wsc, wsErr := ethclient.Dial("ws://localhost:8545")
			if wsErr == nil {
				log.Println("WebSocket重连成功！")
				// 更新客户端连接
				client = wsc
				return nil
			}

			log.Printf("重连失败: %v，%d秒后重试...", wsErr, retryInterval/time.Second)
			time.Sleep(retryInterval)
			// 指数退避
			retryInterval *= 2
		}

		log.Printf("已达到最大重连次数(%d)，重连失败", maxRetries)
		return fmt.Errorf("failed to reconnect after %d attempts", maxRetries)
	}

	// 创建并返回事件处理器
	return NewEventHandler(eventInstance, client, isWebSocket, onEventProcessed, onReconnect)
}

func waitForReceipt(client *ethclient.Client, txHash common.Hash) (*types.Receipt, error) {
	for {
		receipt, err := client.TransactionReceipt(context.Background(), txHash)
		if err == nil {
			return receipt, nil
		}
		// 等待一段时间后再次查询
		time.Sleep(1 * time.Second)
	}
}

// 以下函数已被新的事件处理器替代，保留仅供参考
/*
// 监听Counter合约的changeCount事件并打印最新触发的事件结果（使用轮询方式，作为备用方案）
func listenChangeCountEvent(instance *Counter.Counter) {
	fmt.Println("开始使用轮询方式监听changeCount事件...")

	// 在goroutine中以轮询方式查询最新事件
	go func() {
		var lastBlock uint64 = 0
		for {
			// 创建新的过滤选项，每次轮询都从最后处理的区块开始查询
			filterOpts := &bind.FilterOpts{
				Start:   lastBlock, // 从最后处理的区块开始
				End:     nil,       // 不设置结束区块，查询到最新区块
				Context: context.Background(),
			}

			// 查询事件
			iterator, err := instance.FilterChangeCount(filterOpts)
			if err != nil {
				log.Printf("过滤事件错误: %v\n", err)
				// 等待一段时间后重试
				time.Sleep(3 * time.Second)
				continue
			}

			// 重置最大区块号跟踪变量，用于本次轮询
			var maxBlockNumber uint64 = lastBlock

			// 遍历查询到的事件
			for iterator.Next() {
				event := iterator.Event
				// 只处理新区块中的事件
				if event.Raw.BlockNumber > lastBlock {
					fmt.Printf("监听到最新changeCount事件:\n")
					fmt.Printf("  Action: %s\n", event.Action)
					fmt.Printf("  By: %s\n", event.By.String())
					fmt.Printf("  NewCount: %s\n", event.NewCount.String())
					fmt.Printf("  TxHash: %s\n\n", event.Raw.TxHash.Hex())
				}

				// 跟踪最大区块号
				if event.Raw.BlockNumber > maxBlockNumber {
					maxBlockNumber = event.Raw.BlockNumber
				}
			}

			// 更新lastBlock为本次轮询中找到的最大区块号
			lastBlock = maxBlockNumber

			// 关闭迭代器
			iterator.Close()

			// 等待一段时间后再次查询
			time.Sleep(2 * time.Second)
		}
	}()
}

// 监听Counter合约的changeCount事件并打印最新触发的事件结果（使用WebSocket实时订阅）
func listenChangeCountEventWithWS(instance *Counter.Counter, client *ethclient.Client) {
	fmt.Println("开始使用WebSocket实时订阅changeCount事件...")

	// 创建上下文，用于取消订阅
	ctx, cancel := context.WithCancel(context.Background())

	// 在goroutine中监听事件
	go func() {
		// 创建事件通道
		eventChan := make(chan *Counter.CounterChangeCount)

		// 创建订阅选项
		watchOpts := &bind.WatchOpts{
			Context: ctx,
		}

		// 订阅事件
		sub, err := instance.WatchChangeCount(watchOpts, eventChan)
		if err != nil {
			log.Printf("Failed to watch changeCount event: %v\n", err)
			cancel()
			return
		}

		// 监听完成时取消订阅和关闭通道
		defer func() {
			sub.Unsubscribe()
			close(eventChan)
			cancel()
		}()

		// 处理接收到的事件
		for {
			select {
			case event := <-eventChan:
				// 打印最新事件
				fmt.Printf("监听到最新changeCount事件:\n")
				fmt.Printf("  Action: %s\n", event.Action)
				fmt.Printf("  By: %s\n", event.By.String())
				fmt.Printf("  NewCount: %s\n", event.NewCount.String())
				fmt.Printf("  TxHash: %s\n\n", event.Raw.TxHash.Hex())
			case err := <-sub.Err():
				log.Printf("订阅错误: %v\n", err)
				// 如果发生错误，可以在这里重新订阅或退出
				return
			}
		}
	}()
}*/
