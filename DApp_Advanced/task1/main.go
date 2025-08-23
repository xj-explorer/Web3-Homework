package main

import (
	"context"
	"crypto/ecdsa"
	"fmt"
	"log"
	"math/big"

	"os"

	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/core/types"
	"github.com/ethereum/go-ethereum/crypto"
	"github.com/ethereum/go-ethereum/ethclient"
	"github.com/joho/godotenv"
)

func main() {
	// 加载环境变量
	err := godotenv.Load()
	if err != nil {
		log.Fatalf("Error loading .env file: %v", err)
	}

	// 连接到Sepolia测试网络
	infuraAPIKey := os.Getenv("INFURA_API_KEY")
	if infuraAPIKey == "" {
		log.Fatal("INFURA_API_KEY is not set in .env file")
	}

	client, err := ethclient.Dial(fmt.Sprintf("https://sepolia.infura.io/v3/%s", infuraAPIKey))
	if err != nil {
		log.Fatalf("Failed to connect to the Ethereum client: %v", err)
	}

	fmt.Println("Successfully connected to Sepolia testnet")

	// 查询区块示例
	// blockNumber := big.NewInt(5500000) // 替换为你想要查询的区块号
	// queryBlock(client, blockNumber)

	// 发送交易示例
	sendTransaction(client)
}

// 查询区块信息
func queryBlock(client *ethclient.Client, blockNumber *big.Int) {
	block, err := client.BlockByNumber(context.Background(), blockNumber)
	if err != nil {
		log.Fatalf("Failed to get block: %v", err)
	}

	fmt.Println("\n=== Block Information ===")
	fmt.Printf("Block Number: %d\n", block.Number().Uint64())
	fmt.Printf("Block Hash Hex: %s\n", block.Hash().Hex())
	fmt.Printf("Block Hash: %s\n", block.Hash())
	fmt.Printf("Parent Hash: %s\n", block.ParentHash().Hex())
	fmt.Printf("Time Stamp: %d\n", block.Time())
	fmt.Printf("Difficulty: %d\n", block.Difficulty().Uint64())
	fmt.Printf("Gas Limit: %d\n", block.GasLimit())
	fmt.Printf("Gas Used: %d\n", block.GasUsed())
	fmt.Printf("Transaction Count: %d\n\n", len(block.Transactions()))
}

// 发送交易
func sendTransaction(client *ethclient.Client) {
	// 获取私钥
	privateKeyStr := os.Getenv("PRIVATE_KEY")
	if privateKeyStr == "" {
		log.Fatal("PRIVATE_KEY is not set in .env file")
	}

	privateKey, err := crypto.HexToECDSA(privateKeyStr)
	if err != nil {
		log.Fatalf("Failed to parse private key: %v", err)
	}

	// 从私钥获取公钥和地址
	publicKey := privateKey.Public()
	publicKeyECDSA, ok := publicKey.(*ecdsa.PublicKey)
	if !ok {
		log.Fatal("Cannot assert type: publicKey is not of type *ecdsa.PublicKey")
	}
	// 获取发送方公共地址
	fromAddress := crypto.PubkeyToAddress(*publicKeyECDSA)

	// 获取接收地址
	toAddressStr := os.Getenv("RECIPIENT_ADDRESS")
	if toAddressStr == "" {
		log.Fatal("RECIPIENT_ADDRESS is not set in .env file")
	}

	toAddress := common.HexToAddress(toAddressStr)

	// 获取发送方的nonce
	nonce, err := client.PendingNonceAt(context.Background(), fromAddress)
	if err != nil {
		log.Fatalf("Failed to get nonce: %v", err)
	}

	// 设置转账金额 (0.01 ETH)
	value := big.NewInt(10000000000000000) // 10^16 wei = 0.01 ETH

	// 设置Gas价格和Gas限制
	gasPrice, err := client.SuggestGasPrice(context.Background())
	if err != nil {
		log.Fatalf("Failed to suggest gas price: %v", err)
	}

	gasLimit := uint64(21000) // 简单转账交易的默认Gas限制

	// 创建交易
	var data []byte
	tx := types.NewTransaction(nonce, toAddress, value, gasLimit, gasPrice, data)

	// 签名交易
	chainID, err := client.NetworkID(context.Background())
	if err != nil {
		log.Fatalf("Failed to get chain ID: %v", err)
	}

	signedTx, err := types.SignTx(tx, types.NewEIP155Signer(chainID), privateKey)
	if err != nil {
		log.Fatalf("Failed to sign transaction: %v", err)
	}

	// 发送交易
	if err := client.SendTransaction(context.Background(), signedTx); err != nil {
		log.Fatalf("Failed to send transaction: %v", err)
	}

	fmt.Println("\n=== Transaction Sent ===")
	fmt.Printf("Transaction Hash: %s\n", signedTx.Hash().Hex())
	fmt.Printf("From: %s\n", fromAddress.Hex())
	fmt.Printf("To: %s\n", toAddress.Hex())
	fmt.Printf("Amount: 0.01 ETH\n")
}
