package main

import (
	"context"
	"fmt"
	"log"
	"time"

	// 移除未使用的solana导入
	"github.com/gagliardetto/solana-go/rpc"
)

// 检查RPC连接是否正常
func checkRPCConnection(client *rpc.Client) bool {
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

// 查询区块信息 - 适用于 solana-go v1.12.0
func queryBlockInfo(client *rpc.Client, blockNumber uint64) {
	// 创建上下文，设置超时（增加到60秒）
	ctx, cancel := context.WithTimeout(context.Background(), 60*time.Second)
	defer cancel()

	// 获取区块信息 - 注意：v1.12.0 版本的 API 可能不同
	block, err := client.GetBlock(ctx, blockNumber)
	if err != nil {
		log.Printf("获取区块信息失败: %v", err)
		// 如果失败，提供一些提示信息
		fmt.Println("\n提示：可能是区块号不存在或网络连接问题")
		fmt.Println("请尝试使用不同的区块号或检查网络连接")
		fmt.Println("\n建议：您可以先使用 GetLatestBlockhash 来获取最新的区块哈希，然后再尝试查询区块信息。")
		return
	}

	// 输出区块信息
	fmt.Println("=== 区块信息 ===")
	fmt.Printf("区块号: %d\n", blockNumber)
	fmt.Printf("区块哈希: %s\n", block.Blockhash.String())
	fmt.Printf("父区块哈希: %d\n", block.ParentSlot)
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
		fmt.Printf("交易 %d: %v\n", i+1, tx)
	}
}

// 连接官方测试网端点，实现详细的连接测试和问题分析
func connectToOfficialTestnetEndpoint() (*rpc.Client, bool) {
	// 只保留官方测试网端点
	officialEndpoint := rpc.TestNet_RPC
	fmt.Printf("正在连接到Solana官方测试网端点: %s\n", officialEndpoint)

	// 初始化RPC客户端
	rpcClient := rpc.New(officialEndpoint)

	// 执行连接测试前的网络信息检查
	fmt.Println("\n连接前网络诊断信息:")
	fmt.Println("- 尝试连接的端点: https://api.testnet.solana.com")
	fmt.Println("- 连接超时设置: 60秒")
	fmt.Println("- 当前时间: " + time.Now().Format("2006-01-02 15:04:05"))

	// 尝试连接
	connected := checkRPCConnection(rpcClient)

	return rpcClient, connected
}

func main() {
	// 连接到Solana测试网络
	fmt.Println("正在连接到Solana测试网络...")
	fmt.Println("根据用户要求，仅使用官方测试网端点进行连接测试")

	var rpcClient *rpc.Client
	var connected bool

	// 只连接官方测试网端点
	rpcClient, connected = connectToOfficialTestnetEndpoint()

	// 如果连接失败，提供更详细的网络排查建议
	if !connected {
		fmt.Println("\n=== Solana官方测试网端点连接失败详细分析 ===")
		fmt.Println("\n可能的失败原因:")
		fmt.Println("1. 网络连接问题 - 无法访问国际网络或连接不稳定")
		fmt.Println("2. 防火墙限制 - 本地防火墙或网络提供商阻止了对该端点的访问")
		fmt.Println("3. DNS解析问题 - 无法解析api.testnet.solana.com主机名")
		fmt.Println("4. 端点临时不可用 - Solana测试网可能正在维护或暂时有问题")

		fmt.Println("\n详细排查建议:")
		fmt.Println("1. 检查基本网络连接:")
		fmt.Println("   - 尝试访问其他国际网站，确认网络可以连接到外部")
		fmt.Println("   - 使用浏览器直接访问 https://api.testnet.solana.com 查看返回信息")
		fmt.Println("   - 如果使用代理，请确保代理设置正确并生效")

		fmt.Println("2. 检查防火墙设置:")
		fmt.Println("   - 临时关闭防火墙或添加例外规则，允许连接到api.testnet.solana.com")
		fmt.Println("   - 确认网络提供商没有限制对Solana RPC端点的访问")

		fmt.Println("3. 测试DNS解析:")
		fmt.Println("   - 尝试使用命令行工具如nslookup或ping测试域名解析")
		fmt.Println("   - 考虑临时更换DNS服务器为公共DNS如8.8.8.8或1.1.1.1")

		fmt.Println("4. 考虑使用VPN服务:")
		fmt.Println("   - 如果网络环境有限制，可以尝试使用VPN服务访问国际网络")

		fmt.Println("5. 设置本地Solana测试网(推荐方案):")
		fmt.Println("   - 安装Solana CLI: https://docs.solana.com/cli/install-solana-cli-tools")
		fmt.Println("   - 启动本地测试网: solana-test-validator")
		fmt.Println("   - 修改代码中的RPC端点为: http://localhost:8899")

		fmt.Println("\n请解决网络连接问题后再尝试运行程序获取真实的区块信息。")
		return
	}

	// 1. 查询区块信息
	fmt.Println("\n正在查询区块信息...")
	// 使用多个可能存在的区块号进行尝试
	blockNumbers := []uint64{309552176, 309000000, 308000000, 307000000} // 使用多个可能存在的区块号
	blockFound := false

	if connected {
		// 如果连接成功，查询真实的区块信息
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
				fmt.Printf("区块哈希: %s\n", block.Blockhash.String())
				fmt.Printf("父区块哈希: %d\n", block.ParentSlot)
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
					fmt.Printf("交易 %d: %v\n", i+1, tx)
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
			// 尝试使用GetLatestBlockhash获取最新区块信息
			fmt.Println("\n尝试获取最新区块哈希信息...")
			ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
			defer cancel()

			latestBlockhash, err := rpcClient.GetLatestBlockhash(ctx, rpc.CommitmentFinalized)
			if err == nil {
				fmt.Println("=== 最新区块哈希信息 ===")
				fmt.Printf("区块哈希: %s\n", latestBlockhash.Value.Blockhash.String())
				fmt.Printf("上次有效区块高度: %d\n", latestBlockhash.Value.LastValidBlockHeight)
				fmt.Println("\n提示：您可以使用这个区块哈希或附近的区块号来查询区块信息。")
			} else {
				fmt.Printf("获取最新区块哈希失败: %v\n", err)
			}
		}
	}
}
