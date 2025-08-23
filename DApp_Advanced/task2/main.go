package main

import (
	"context"
	"crypto/ecdsa"
	"fmt"
	"log"
	"math/big"
	"time"

	Counter "counter/counter" // 别名导入，使用首字母大写的包名

	"github.com/ethereum/go-ethereum"
	"github.com/ethereum/go-ethereum/accounts/abi/bind"
	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/core/types"
	"github.com/ethereum/go-ethereum/crypto"
	"github.com/ethereum/go-ethereum/ethclient"
)

func main() {
	// 连接到Sepolia测试网络
	client, err := ethclient.Dial("https://sepolia.infura.io/v3/1ea13488a02d481c8663b068c0d6fa35")
	if err != nil {
		log.Fatalf("Failed to connect to the Ethereum client: %v", err)
	}

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

	// 替换为部署的合约地址
	contractAddress := common.HexToAddress("0x22EfB474EA3cC9C1AEF9bA97b57d1a1590401197")

	// 实例化合约
	instance, err := Counter.NewCounter(contractAddress, client)
	if err != nil {
		log.Fatalf("Failed to instantiate a Counter contract: %v", err)
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

func waitForReceipt(client *ethclient.Client, txHash common.Hash) (*types.Receipt, error) {
	for {
		receipt, err := client.TransactionReceipt(context.Background(), txHash)
		if err == nil {
			return receipt, nil
		}
		if err != ethereum.NotFound {
			return nil, err
		}
		// 等待一段时间后再次查询
		time.Sleep(1 * time.Second)
	}
}
