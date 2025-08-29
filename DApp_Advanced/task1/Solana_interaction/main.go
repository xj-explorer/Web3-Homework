package main

import (
	"context"
	"fmt"

	"time"

	"github.com/gagliardetto/solana-go"
	"github.com/gagliardetto/solana-go/rpc"
)

// getBlockByHeight 通过区块高度查询区块数据
func getBlockByHeight(ctx context.Context, client *rpc.Client, height uint64) error {
	// 直接调用GetBlock函数，使用默认选项
	result, err := client.GetBlock(ctx, height)
	if err != nil {
		return fmt.Errorf("获取区块数据失败: %w", err)
	}
	// 打印区块的基本信息
	fmt.Printf("区块高度 %d 信息:\n", height)
	fmt.Printf("  区块哈希: %s\n", result.Blockhash)
	fmt.Printf("  父区块哈希: %s\n", result.PreviousBlockhash)
	fmt.Printf("  交易数量: %d\n", len(result.Transactions))
	fmt.Printf("  奖励数量: %d\n", len(result.Rewards))
	return nil
}

// getAccountBalance 查询指定账户的SOL余额
func getAccountBalance(ctx context.Context, client *rpc.Client, address string) (uint64, error) {
	// 解析账户地址
	pubKey, err := solana.PublicKeyFromBase58(address)
	if err != nil {
		return 0, fmt.Errorf("无效的账户地址: %w", err)
	}

	// 查询余额，添加承诺类型参数
	balance, err := client.GetBalance(ctx, pubKey, rpc.CommitmentFinalized)
	if err != nil {
		return 0, fmt.Errorf("获取账户余额失败: %w", err)
	}

	// 打印账户余额信息
	fmt.Printf("账户 %s 余额: %.9f SOL\n", address, float64(balance.Value)/1000000000)

	// 返回余额值（lamports单位）
	return balance.Value, nil
}

// transferSOL 执行原生SOL转账交易
func transferSOL(ctx context.Context, client *rpc.Client, fromPrivateKey string, toAddress string, amount uint64) (string, error) {
	// 解析发送者私钥
	fromKeyPair, err := solana.PrivateKeyFromBase58(fromPrivateKey)
	if err != nil {
		return "", fmt.Errorf("无效的发送者私钥: %w", err)
	}

	// 解析接收者地址
	toPubKey, err := solana.PublicKeyFromBase58(toAddress)
	if err != nil {
		return "", fmt.Errorf("无效的接收者地址: %w", err)
	}

	// 获取最新区块哈希，用于交易
	recentBlockhash, err := client.GetLatestBlockhash(ctx, rpc.CommitmentFinalized)
	if err != nil {
		return "", fmt.Errorf("获取最新区块哈希失败: %w", err)
	}

	// 构建转账指令的数据
	transferData := make([]byte, 9)
	transferData[0] = 2 // 转账指令代码
	// 金额转为小端字节序
	for i := 0; i < 8; i++ {
		transferData[1+i] = byte(amount >> (i * 8))
	}

	// 创建账户元数据
	fromAccount := &solana.AccountMeta{
		PublicKey:  fromKeyPair.PublicKey(),
		IsSigner:   true,
		IsWritable: true,
	}
	toAccount := &solana.AccountMeta{
		PublicKey:  toPubKey,
		IsSigner:   false,
		IsWritable: true,
	}

	// 创建指令
	transferInstruction := solana.NewInstruction(
		solana.SystemProgramID,
		solana.AccountMetaSlice{fromAccount, toAccount},
		transferData,
	)

	// 创建交易
	tx, err := solana.NewTransaction(
		[]solana.Instruction{transferInstruction},
		recentBlockhash.Value.Blockhash,
		solana.TransactionPayer(fromKeyPair.PublicKey()),
	)
	if err != nil {
		return "", fmt.Errorf("创建交易失败: %w", err)
	}

	// 签名交易
	_, err = tx.Sign(func(key solana.PublicKey) *solana.PrivateKey {
		if key.Equals(fromKeyPair.PublicKey()) {
			return &fromKeyPair
		}
		return nil
	})
	if err != nil {
		return "", fmt.Errorf("签名交易失败: %w", err)
	}

	// 发送交易
	sig, err := client.SendTransaction(ctx, tx)
	if err != nil {
		return "", fmt.Errorf("发送交易失败: %w", err)
	}

	// 打印交易信息
	fmt.Printf("转账交易已发送\n")
	fmt.Printf("  交易签名: %s\n", sig)
	fmt.Printf("  发送者: %s\n", fromKeyPair.PublicKey())
	fmt.Printf("  接收者: %s\n", toPubKey)
	fmt.Printf("  转账金额: %.9f SOL\n", float64(amount)/1000000000)

	return sig.String(), nil
}

// demoBalanceQuery 演示查询账户余额功能
func demoBalanceQuery(ctx context.Context, client *rpc.Client) {
	// 示例账户地址（Solana基金会的公开地址）
	demoAccount := "7xKDfKtkzC8U3w9L527VqJxQmP3Gm77S6XcNwG3yKzX"

	fmt.Println("\n查询账户余额:")
	fmt.Printf("查询示例账户 %s 的余额...\n", demoAccount)

	// 调用getAccountBalance函数查询余额
	_, err := getAccountBalance(ctx, client, demoAccount)
	if err != nil {
		fmt.Printf("查询余额失败: %v\n", err)
		fmt.Println("提示：您可以尝试替换为其他有效的测试网账户地址")
	}
}

func main() {
	// 创建带超时的上下文
	// 设置30秒超时，这样可以控制RPC调用的最大等待时间
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel() // 确保在函数退出时取消上下文

	// 创建RPC客户端连接到Solana测试网络
	// 注意：中国大陆可能难以直接连接Solana官方RPC端点

	endpoint := rpc.TestNet_RPC
	// 创建客户端
	client := rpc.New(endpoint)

	fmt.Println("Solana交互功能演示")
	fmt.Printf("连接到Solana测试网络: %s\n", endpoint)
	fmt.Println("注意：如果连接失败，可能是网络限制，请尝试更换注释中提供的其他端点")

	// 获取最新区块高度
	latestBlockHeight, err := client.GetSlot(ctx, rpc.CommitmentFinalized)
	if err != nil {
		fmt.Printf("获取最新区块高度失败: %v\n", err)
		return
	}

	fmt.Printf("最新区块高度: %d\n", latestBlockHeight)
	fmt.Println("查询区块数据...")

	// 调用getBlockByHeight函数查询最新区块数据
	// 为了避免查询太大的区块，我们查询比最新区块小一些的区块
	blockHeight := latestBlockHeight - 10
	err = getBlockByHeight(ctx, client, blockHeight)
	if err != nil {
		fmt.Printf("获取区块数据失败: %v\n", err)
		return
	}

	// // 查询示例账户余额
	// demoBalanceQuery(ctx, client)

	// // 注意：以下转账功能需要有效的私钥才能执行
	// // 为了安全，这里不执行实际的转账操作，仅打印提示信息
	// fmt.Println("\n转账功能演示:")
	// fmt.Println("注意：实际转账需要提供有效的发送者私钥")
	// fmt.Println("您可以在transferSOL函数中填入有效的私钥、接收地址和转账金额来测试转账功能")

	// fmt.Println("\nSolana交互功能演示完成")
}
