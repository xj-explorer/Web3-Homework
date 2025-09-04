package main

import (
	"encoding/json"
	"fmt"
	"io/ioutil"
	"log"
	"net/http"
	"os"
)

func main() {
	// 1. 生成测试网络地址和私钥
	// addr, privKey, err := generateTestnetAddressAndSave()
	// if err != nil {
	//	log.Fatalf("生成地址和保存失败: %v\n", err)
	// }
	// log.Printf("生成的测试网络地址和私钥: %s, %s\n", addr, privKey)

	// 获取配置 - 使用Blockstream.info服务的配置
	config := GetBlockstreamConfig()

	// 2. 查询区块信息 - 确保queryBlockInformation功能正常工作
	queryBlockInformation(config)

	// 3. 查询指定地址的余额
	testAddress := "tb1q3hrpakdutfxr3tawn3aqcyd0l6latcx7e4rswt"
	getBalance(config, testAddress)

	// 4. 发送比特币交易 (注意：这里使用给定的私钥和地址)
	// 从私钥派生对应的地址作为发送方地址
	// senderPrivKey := "p2wpkh:cPskKjCgsf6vTgYeNjEFTBsnCZmHeZYaac85wKhCU7rCGg5hEajk"
	// receiverAddr := "tb1qtwef60xk9qw7nauapefhm8wh95r5snh0a044k3"

	// 由于我们使用Blockstream API，这里直接查询给定私钥对应的地址
	// 在实际应用中，您可能需要确保该地址有足够的UTXO
	// senderAddr := "tb1q3hrpakdutfxr3tawn3aqcyd0l6latcx7e4rswt" // 这是与给定私钥对应的测试网络地址

	// sendBitcoinTransactionDemo(config, senderPrivKey, senderAddr, receiverAddr)
}

// 生成测试网络地址和私钥，并保存到文件
func generateTestnetAddressAndSave() (string, string, error) {
	fmt.Println("===== 生成测试网络地址和私钥 =====")
	addr, privKey, err := GenerateTestnetAddress()
	if err != nil {
		return "", "", fmt.Errorf("生成地址失败: %v", err)
	}

	// 保存地址和私钥到文件
	type KeyAddress struct {
		Address string `json:"address"`
		PrivKey string `json:"private_key"`
	}

	keyAddr := KeyAddress{
		Address: addr,
		PrivKey: privKey,
	}

	jsonData, err := json.MarshalIndent(keyAddr, "", "  ")
	if err != nil {
		return "", "", fmt.Errorf("JSON序列化失败: %v", err)
	}

	filePath := "pkey_address.json"
	err = os.WriteFile(filePath, jsonData, 0644)
	if err != nil {
		return "", "", fmt.Errorf("写入文件失败: %v", err)
	}

	fmt.Println("生成的测试网络地址和私钥:")
	fmt.Printf("地址: %s\n", addr)
	fmt.Printf("私钥(WIF): %s\n", privKey)
	fmt.Printf("地址和私钥已保存到文件: %s\n", filePath)
	fmt.Println("注意: 请妥善保管您的私钥和包含私钥的文件，不要分享给他人!")
	fmt.Println("\n您可以通过比特币测试网络 faucet 获取测试币，例如:")
	fmt.Println("- https://coinfaucet.eu/en/btc-testnet/")
	fmt.Println("- https://testnet-faucet.mempool.co/")
	fmt.Println("==================================\n")

	return addr, privKey, nil
}

// 查询区块信息
func queryBlockInformation(config *Config) {
	fmt.Println("===== 查询区块信息 =====")
	blockHeight := int64(4646478) // 选择一个有效的测试网络区块高度
	fmt.Printf("查询区块高度: %d\n", blockHeight)
	err := QueryAndPrintBlock(config, blockHeight)
	if err != nil {
		log.Printf("查询区块失败: %v\n", err)
	}
}

// 查询指定地址的余额
func getBalance(config *Config, address string) {
	fmt.Println("\n===== 查询地址余额 =====")
	fmt.Printf("查询地址: %s\n", address)
	balance, err := QueryAddressBalance(config, address)
	if err != nil {
		log.Printf("查询余额失败: %v\n", err)
	} else {
		fmt.Printf("地址余额: %d 聪 (%.8f BTC)\n", balance, float64(balance)/100000000)
	}
	fmt.Println("========================")
}

// QueryAddressBalance 查询指定地址的余额
func QueryAddressBalance(config *Config, address string) (int64, error) {
	// 创建HTTP客户端
	client := &http.Client{}

	// 构建API URL
	protocol := "http"
	if config.UseTLS {
		protocol = "https"
	}
	url := fmt.Sprintf("%s://%s/address/%s/utxo", protocol, config.RPCServer, address)

	// 发送请求获取UTXO列表
	resp, err := client.Get(url)
	if err != nil {
		return 0, fmt.Errorf("获取UTXO失败: %v", err)
	}
	defer resp.Body.Close()

	// 检查响应状态码
	if resp.StatusCode != http.StatusOK {
		body, _ := ioutil.ReadAll(resp.Body)
		return 0, fmt.Errorf("获取UTXO失败: 状态码 %d, 响应: %s", resp.StatusCode, string(body))
	}

	// 定义UTXO结构体
	type UTXO struct {
		Value int64 `json:"value"`
	}

	// 解析JSON响应
	var utxos []UTXO
	err = json.NewDecoder(resp.Body).Decode(&utxos)
	if err != nil {
		return 0, fmt.Errorf("解析UTXO响应失败: %v", err)
	}

	// 计算总余额
	var totalBalance int64
	for _, utxo := range utxos {
		totalBalance += utxo.Value
	}

	return totalBalance, nil
}

// 发送比特币交易演示
func sendBitcoinTransactionDemo(config *Config, senderPrivKey, senderAddr, receiverAddr string) {
	fmt.Println("===== 发送比特币交易 =====")
	// 这里使用生成的地址作为发送方和接收方仅用于演示
	// 实际使用时，发送方私钥需要有测试币
	amount := int64(1000) // 1000聪
	fee := int64(1000)    // 1000聪

	fmt.Printf("从 %s (地址: %s) 发送 %d 聪到 %s\n", senderPrivKey[:10]+"...", senderAddr, amount, receiverAddr)
	txHash, err := SendBitcoinTransaction(config, senderPrivKey, senderAddr, receiverAddr, amount, fee)
	if err != nil {
		log.Printf("发送交易失败: %v\n", err)
	} else {
		fmt.Printf("交易已发送，哈希值: %s\n", txHash)
	}
	fmt.Println("===========================")
}
