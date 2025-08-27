package main

import (
	"context"
	"fmt"
	"log"
	"time"

	"github.com/portto/solana-go-sdk/client"
	"github.com/portto/solana-go-sdk/rpc"
)

// 检查RPC连接是否正常
func checkRPCConnection(client *client.Client) bool {
	// 增加超时时间到60秒，给网络连接更多时间
	ctx, cancel := context.WithTimeout(context.Background(), 60*time.Second)
	defer cancel()

	// 使用GetVersion来测试连接，这是一个轻量级的API调用
	version, err := client.GetVersion(ctx)
	if err != nil {
		log.Printf("RPC连接测试失败: %v", err)
		// 提供更具体的错误分析
		if err.Error() == "context deadline exceeded" {
			fmt.Println("  错误分析: 连接超时，可能是网络延迟高、防火墙限制或代理问题")
			fmt.Println("  网络排查建议: 检查是否可以访问其他国际网站，可能需要调整网络设置")
		} else if err.Error() == "dial tcp: lookup" {
			fmt.Println("  错误分析: 无法解析主机名，可能是DNS问题或网络连接中断")
			fmt.Println("  网络排查建议: 尝试刷新DNS缓存或更换DNS服务器")
		} else if err.Error() == "connection refused" {
			fmt.Println("  错误分析: 连接被拒绝，可能是端点不可用或防火墙阻止")
		} else {
			fmt.Println("  错误分析: 其他连接问题，请检查网络设置")
		}
		return false
	}

	fmt.Printf("RPC连接成功！Solana版本: %s\n", version.SolanaCore)
	return true
}

// 连接官方测试网端点，实现详细的连接测试和问题分析
func connectToOfficialTestnetEndpoint() (*client.Client, bool) {
	// 只保留官方测试网端点，使用字符串直接定义
	officialEndpoint := rpc.DevnetRPCEndpoint
	fmt.Printf("正在连接到Solana官方测试网端点: %s\n", officialEndpoint)

	// 初始化RPC客户端
	rpcClient := client.NewClient(officialEndpoint)

	// 执行连接测试前的网络信息检查
	fmt.Println("\n连接前网络诊断信息:")
	fmt.Println("- 尝试连接的端点: https://api.testnet.solana.com")
	fmt.Println("- 连接超时设置: 60秒")
	fmt.Println("- 当前时间: " + time.Now().Format("2006-01-02 15:04:05"))

	// 尝试连接
	connected := checkRPCConnection(rpcClient)

	return rpcClient, connected
}

// 查询区块信息的函数
func queryBlockInformation(rpcClient *client.Client) bool {
	fmt.Println("\n正在查询区块信息...")
	// 使用多个可能存在的区块号进行尝试
	blockNumbers := []uint64{309552176, 309000000, 308000000, 307000000} // 使用多个可能存在的区块号
	blockFound := false

	// 查询真实的区块信息
	for _, blockNumber := range blockNumbers {
		fmt.Printf("尝试查询区块号: %d\n", blockNumber)
		// 使用更长的超时时间（60秒）来查询区块信息
		ctx, cancel := context.WithTimeout(context.Background(), 60*time.Second)
		defer cancel()

		block, err := rpcClient.GetBlock(ctx, blockNumber)
		if err == nil {
			// 成功获取到区块信息，输出详细内容
			fmt.Println("=== 区块信息 ===")
			fmt.Printf("区块号: %d\n", blockNumber)
			// block.Blockhash已经是string类型，不需要调用String()方法
			fmt.Printf("区块哈希: %s\n", block.Blockhash)
			// 修复字段名大小写问题
			fmt.Printf("父区块哈希: %d\n", block.ParentSLot)
			fmt.Printf("交易数量: %d\n", len(block.Transactions))
			// 正确处理 BlockTime 指针
			if block.BlockTime != nil {
				fmt.Printf("区块时间戳: %s\n", time.Unix(int64(*block.BlockTime), 0).Format("2006-01-02 15:04:05"))
			}

			// 输出前5个交易的信息
			fmt.Println("\n前5个交易信息:")
			for i, tx := range block.Transactions {
				if i >= 5 {
					break
				}
				fmt.Printf("交易 %d: %v\n", i+1, tx.Transaction.Signatures)
			}
			blockFound = true
			break
		}
		fmt.Printf("区块 %d 查询失败: %v\n", blockNumber, err)
		// 查询失败后等待2秒再试下一个区块号
		time.Sleep(2 * time.Second)
	}

	if !blockFound {
		fmt.Println("\n无法查询到任何区块信息。请尝试使用不同的区块号。")
	}

	return blockFound
}

func main() {
	// 连接到Solana测试网络
	fmt.Println("正在连接到Solana测试网络...")

	var rpcClient *client.Client
	var connected bool

	// 只连接官方测试网端点
	rpcClient, connected = connectToOfficialTestnetEndpoint()

	// 如果连接失败，提供更详细的网络排查建议
	if !connected {
		fmt.Println("\n=== Solana官方测试网端点连接失败 ===")
		return
	}

	// 调用函数查询区块信息
	if connected {
		queryBlockInformation(rpcClient)
	}

}
