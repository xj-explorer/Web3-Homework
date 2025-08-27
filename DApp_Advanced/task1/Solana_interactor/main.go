package main

import (
	"context"
	"fmt"
	"log"
	"time"

	"github.com/gagliardetto/solana-go"
	"github.com/gagliardetto/solana-go/rpc"
)

func main() {
	// 尝试多个 Solana devnet RPC 端点
	rpcEndpoints := []string{
		"https://devnet.helius-rpc.com",
		"https://solana-devnet.g.alchemy.com/v2/demo",
		"https://devnet.genesysgo.net",
	}

	var client *rpc.Client
	var err error

	// 尝试连接到可用的 RPC 端点
	for _, endpoint := range rpcEndpoints {
		fmt.Printf("尝试连接到 RPC 端点: %s\n", endpoint)
		client = rpc.New(endpoint)

		// 设置超时上下文
		ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()

		// 测试连接
		_, testErr := client.GetVersion(ctx)
		if testErr == nil {
			fmt.Printf("成功连接到 RPC 端点: %s\n", endpoint)
			err = nil
			break
		} else {
			fmt.Printf("连接失败: %v\n", testErr)
			err = testErr
		}
	}

	if err != nil {
		fmt.Println("无法连接到任何 Solana devnet RPC 端点。以下是一些可能的原因和解决方案：")
		fmt.Println("1. 网络连接问题 - 请检查您的网络连接")
		fmt.Println("2. 防火墙限制 - 请确保允许访问 Solana RPC 端点")
		fmt.Println("3. RPC 端点暂时不可用 - 请稍后再试")
		fmt.Println("\n程序演示:")

		// 展示代码的主要功能，即使没有实际连接
		demoWithoutConnection()
		return
	}

	// 获取最新的区块高度
	height, err := client.GetSlot(context.Background(), rpc.CommitmentFinalized)
	if err != nil {
		log.Printf("获取区块高度失败: %v\n", err)
	} else {
		fmt.Printf("当前 Solana devnet 区块高度: %d\n", height)
	}

	// 获取账户余额示例
	// 使用一个已知的 devnet 测试账户
	accountPubKey := solana.MustPublicKeyFromBase58("9vvPmJtjLtYHobt1bXcBzG1ABbBH657mU661kKST4pQp")

	balance, err := client.GetBalance(context.Background(), accountPubKey, rpc.CommitmentFinalized)
	if err != nil {
		log.Printf("获取账户余额失败: %v\n", err)
	} else {
		fmt.Printf("账户 %s 的余额: %d SOL\n", accountPubKey.String(), balance.Value/(1000000000))
	}

	fmt.Println("Solana 交互器示例完成!")
}

// 无实际连接时的演示函数
func demoWithoutConnection() {
	fmt.Println("1. 创建 Solana RPC 客户端")
	fmt.Println("   - 通常连接到 https://api.devnet.solana.com 或其他公共端点")
	fmt.Println("   - 可设置超时、重试策略等")

	fmt.Println("\n2. 主要功能:")
	fmt.Println("   - 获取区块高度: client.GetSlot()")
	fmt.Println("   - 查询账户余额: client.GetBalance()")
	fmt.Println("   - 发送交易: client.SendTransaction()")
	fmt.Println("   - 获取区块信息: client.GetBlock()")
	fmt.Println("   - 订阅事件: client.Subscribe()")

	fmt.Println("\n3. 账户操作:")
	fmt.Println("   - 生成密钥对: solana.NewRandomPrivateKey()")
	fmt.Println("   - 从私钥创建账户: solana.PrivateKey.FromBytes()")
	fmt.Println("   - 获取公钥: privateKey.PublicKey()")

	fmt.Println("\n该示例展示了 Solana Go 客户端库的基本用法，即使在没有网络连接的情况下也能了解其核心功能。")
}