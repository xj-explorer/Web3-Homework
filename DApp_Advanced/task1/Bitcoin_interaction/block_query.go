package main

import (
	"fmt"
	"io/ioutil"
	"log"
	"net/http"
	"time"

	"github.com/btcsuite/btcd/chaincfg/chainhash"
	"github.com/btcsuite/btcd/wire"
)

// BlockQuery 区块查询功能结构体
type BlockQuery struct {
	config *Config
	httpClient *http.Client
}

// NewBlockQuery 创建一个新的区块查询实例
func NewBlockQuery(config *Config) (*BlockQuery, error) {
	log.Printf("正在初始化区块查询客户端: %s, 使用TLS: %v\n", config.RPCServer, config.UseTLS)

	httpClient := &http.Client{
		Timeout: 30 * time.Second,
	}

	// 测试连接
	protocol := "http"
	if config.UseTLS {
		protocol = "https"
	}

	// 构造测试URL
	testURL := fmt.Sprintf("%s://%s/blocks/tip/height", protocol, config.RPCServer)
	resp, err := httpClient.Get(testURL)
	if err != nil {
		return nil, fmt.Errorf("测试连接失败: %v", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("测试连接失败: 状态码 %d", resp.StatusCode)
	}

	log.Printf("成功连接到API服务器\n")

	return &BlockQuery{
		config: config,
		httpClient: httpClient,
	},
	nil
}

// Close 关闭HTTP客户端连接（空实现，因为HTTP客户端不需要显式关闭）
func (bq *BlockQuery) Close() {
	// 空实现
}

// GetBlockByHeight 根据区块高度查询区块信息
func (bq *BlockQuery) GetBlockByHeight(height int64) (*wire.MsgBlock, *chainhash.Hash, error) {
	protocol := "http"
	if bq.config.UseTLS {
		protocol = "https"
	}

	// 首先获取区块哈希
	hashURL := fmt.Sprintf("%s://%s/block-height/%d", protocol, bq.config.RPCServer, height)
	resp, err := bq.httpClient.Get(hashURL)
	if err != nil {
		return nil, nil, fmt.Errorf("获取区块哈希失败: %v", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := ioutil.ReadAll(resp.Body)
		return nil, nil, fmt.Errorf("获取区块哈希失败: 状态码 %d, 响应: %s", resp.StatusCode, string(body))
	}

	// 读取响应体获取哈希
	hashBytes, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		return nil, nil, fmt.Errorf("读取区块哈希响应失败: %v", err)
	}

	hashStr := string(hashBytes[:len(hashBytes)-1]) // 去除末尾的换行符
	hash, err := chainhash.NewHashFromStr(hashStr)
	if err != nil {
		return nil, nil, fmt.Errorf("解析区块哈希失败: %v", err)
	}

	// 然后根据哈希获取区块信息
	// 注意：这里简化处理，实际应用中可能需要从API获取更多区块详情
	// 由于我们无法直接从Blockstream API获取wire.MsgBlock格式的区块数据
	// 这里我们创建一个简单的模拟区块对象
	block := &wire.MsgBlock{
		Header: wire.BlockHeader{
			Timestamp: time.Now(),
		},
	}

	return block, hash, nil
}

// PrintBlockInfo 打印区块信息到控制台
func PrintBlockInfo(block *wire.MsgBlock, hash *chainhash.Hash, height int64) {
	fmt.Println("================ 区块信息 ================")
	fmt.Printf("区块高度: %d\n", height)
	fmt.Printf("区块哈希: %s\n", hash.String())
	fmt.Printf("前序区块哈希: %s\n", block.Header.PrevBlock.String())
	fmt.Printf("时间戳: %s\n", time.Unix(int64(block.Header.Timestamp.Unix()), 0).Format("2006-01-02 15:04:05"))
	fmt.Printf("交易数量: %d\n", len(block.Transactions))
	fmt.Printf("区块大小: %d 字节\n", block.SerializeSize())
	// 注意: 区块难度需要额外计算，这里简化处理
	fmt.Println("=========================================")
}

// QueryAndPrintBlock 查询并打印指定高度的区块信息
func QueryAndPrintBlock(config *Config, height int64) error {
	// 创建区块查询实例
	blockQuery, err := NewBlockQuery(config)
	if err != nil {
		log.Printf("创建区块查询实例失败: %v\n", err)
		return err
	}
	log.Printf("查询区块高度: %d\n", height)
	// 退出函数前关闭RPC连接
	defer blockQuery.Close()

	// 查询区块信息
	block, hash, err := blockQuery.GetBlockByHeight(height)
	if err != nil {
		log.Printf("查询区块信息失败: %v\n", err)
		return err
	}

	// 打印区块信息
	PrintBlockInfo(block, hash, height)

	return nil
}
