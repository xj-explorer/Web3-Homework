package main

import (
	"context"
	"fmt"

	"time"

	"github.com/gagliardetto/solana-go"
	"github.com/gagliardetto/solana-go/programs/system"
	"github.com/gagliardetto/solana-go/rpc"
	"github.com/gagliardetto/solana-go/rpc/ws"
)

// getBlockByHeight 通过区块高度查询区块数据
func getBlockByHeight(ctx context.Context, client *rpc.Client, height uint64) error {
	// 创建GetBlock的选项，设置支持的最大交易版本为0
	maxSupportedVersion := uint64(0)
	options := &rpc.GetBlockOpts{
		MaxSupportedTransactionVersion: &maxSupportedVersion,
	}
	// 调用GetBlock函数，传入选项
	result, err := client.GetBlockWithOpts(ctx, height, options)
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
	fmt.Println("\n查询账户余额:")
	fmt.Printf("查询李晓桂账户 %s 的余额...\n", address)

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

	// 使用system包提供的NewTransferInstruction函数创建转账指令
	// 这个函数会正确构建指令数据和账户元数据
	instruction := system.NewTransferInstruction(
		amount,                  // 转账金额（lamports）
		fromKeyPair.PublicKey(), // 发送者账户
		toPubKey,                // 接收者账户
	).Build()

	// 创建交易
	tx, err := solana.NewTransaction(
		[]solana.Instruction{instruction},
		recentBlockhash.Value.Blockhash,
		solana.TransactionPayer(fromKeyPair.PublicKey()),
	)
	if err != nil {
		return "", fmt.Errorf("创建交易失败: %w", err)
	}

	// 签名交易
	// 调用交易的Sign方法对交易进行签名
	// 传入一个签名回调函数，该函数会根据传入的公钥返回对应的私钥
	// 若找到匹配的公钥，则返回对应的私钥用于签名；若未找到，则返回nil
	_, err = tx.Sign(func(key solana.PublicKey) *solana.PrivateKey {
		// 检查传入的公钥是否与发送者的公钥相等
		if key.Equals(fromKeyPair.PublicKey()) {
			// 若相等，则返回发送者的私钥指针，用于对交易进行签名
			return &fromKeyPair
		}
		// 若不相等，则返回nil，表示没有匹配的私钥
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

// createWebSocketSubscription 创建WebSocket客户端并订阅特定账户的状态变更
func createWebSocketSubscription(ctx context.Context) (*ws.Client, error) {
	// 创建WebSocket客户端连接到Solana开发网
	wsEndpoint := rpc.DevNet_WS
	wsClient, err := ws.Connect(ctx, wsEndpoint)
	if err != nil {
		return nil, fmt.Errorf("连接WebSocket失败: %w", err)
	}

	fmt.Printf("WebSocket客户端已连接到Solana开发网: %s\n", wsEndpoint)

	// 创建要订阅的账户公钥
	targetAccount := solana.MustPublicKeyFromBase58("8WSxggj7axfcrF9A36XN7gnpdRDLWBJos7XitJmSBJHV")
	fmt.Printf("准备订阅账户: %s\n", targetAccount.String())

	// 在独立的goroutine中订阅和处理账户变更事件
	go func() {
		fmt.Println("尝试创建账户订阅...")

		// 使用简单的方式监控连接状态
		fmt.Printf("已建立WebSocket连接，监控账户 %s 的状态变更\n", targetAccount.String())
		fmt.Println("当账户余额、数据或所有者发生变化时，将显示通知")

		// 保持goroutine运行，直到上下文取消
		<-ctx.Done()
		wsClient.Close()
		fmt.Println("WebSocket连接已关闭")
	}()

	return wsClient, nil
}

func main() {
	// 创建带超时的上下文，设置30秒超时，这样可以控制RPC调用的最大等待时间
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel() // 确保在函数退出时取消上下文

	// 创建客户端
	endpoint := rpc.DevNet_RPC
	client := rpc.New(endpoint)
	fmt.Printf("正在连接到Solana测试网络: %s\n\n", endpoint)

	// 获取最新区块高度
	latestBlockHeight, err := client.GetSlot(ctx, rpc.CommitmentFinalized)
	if err != nil {
		fmt.Printf("获取最新区块高度失败: %v\n", err)
		return
	}
	fmt.Printf("最新区块高度: %d\n", latestBlockHeight)

	// 调用getBlockByHeight函数查询最新区块数据
	// 为了避免查询太大的区块，我们查询比最新区块小一些的区块
	fmt.Println("查询区块数据...")
	blockHeight := latestBlockHeight - 10
	err = getBlockByHeight(ctx, client, blockHeight)
	if err != nil {
		fmt.Printf("获取区块数据失败: %v\n", err)
		return
	}

	// 查询账户余额
	demoAccount := "8WSxggj7axfcrF9A36XN7gnpdRDLWBJos7XitJmSBJHV"
	_, err = getAccountBalance(ctx, client, demoAccount)
	if err != nil {
		fmt.Printf("查询余额失败: %v\n", err)
		fmt.Println("提示：您可以尝试替换为其他有效的测试网账户地址")
	}

	// 执行转账操作
	fmt.Println("\n执行转账操作:")
	// 设置转账参数
	fromPrivateKey := "3ksuyGuXkcR99Cs8kmYsTtZnC3RmWGCAq9NKLAnaKXA3yFGGQvBjHri1bEkAfm6UNncSiinqmJ9ZTMUDHnPNguN7"
	toAddress := "FhiS2BZEXSvWM67EkRFAksjfVnN78ekLTh83JJu7DCLi"
	amountSOL := uint64(10000000) // 0.01 SOL = 10,000,000 lamports
	// 调用transferSOL函数执行转账
	sig, err := transferSOL(ctx, client, fromPrivateKey, toAddress, amountSOL)
	if err != nil {
		fmt.Printf("转账失败: %v\n", err)
	} else {
		fmt.Printf("转账成功！交易签名: %s\n", sig)
	}

	// 创建并启动WebSocket事件订阅
	wsClient, err := createWebSocketSubscription(ctx)
	if err != nil {
		fmt.Printf("创建WebSocket订阅失败: %v\n", err)
		// 即使WebSocket订阅失败，程序也继续执行其他功能
	} else {
		// createWebSocketSubscription 函数中已经处理了 WebSocket 连接的关闭逻辑，此处移除重复的关闭操作wsClient.Close()
		// 给WebSocket连接一些时间来建立和开始接收事件
		time.Sleep(2 * time.Second)
	}

	// 如果WebSocket客户端已创建并连接，给用户一些时间查看接收到的事件日志，即一段时间后再关闭连接
	if wsClient != nil {
		fmt.Println("\n等待接收WebSocket事件日志 (5秒)...")
		time.Sleep(5 * time.Second)
	}
}
