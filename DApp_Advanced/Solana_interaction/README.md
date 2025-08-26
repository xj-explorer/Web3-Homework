# Solana区块链交互项目

本项目使用 Solana Go SDK (github.com/gagliardetto/solana-go@v1.12.0) 实现了与 Solana 区块链的基本交互功能，包括查询区块信息和发送交易。

## 环境搭建

### 前提条件

- 已安装 Go 语言环境（建议 Go 1.18 或更高版本）
- 已安装 Git

### 安装步骤

1. 克隆或下载本项目到本地

2. 进入项目目录

```bash
cd Solana_interaction
```

3. 初始化 Go 模块（如果尚未初始化）

```bash
go mod init solana-interaction
```

4. 安装 Solana Go SDK

```bash
go get github.com/gagliardetto/solana-go@v1.12.0
```

## 获取 Solana 测试网络的 API Key

本项目默认使用公共的 Solana 测试网络 RPC 端点（`https://api.testnet.solana.com`），无需额外的 API Key。如果您需要使用其他 RPC 提供商（如 Alchemy、QuickNode 等）的服务，可以按照以下步骤操作：

1. 访问 RPC 提供商的网站（如 [Alchemy](https://www.alchemy.com/)、[QuickNode](https://www.quicknode.com/)）
2. 注册账户并创建一个 Solana 测试网络的项目
3. 获取项目提供的 RPC URL
4. 在代码中替换默认的 RPC 端点

```go
// 替换为您的 RPC URL
rpcClient := rpc.New("https://your-custom-rpc-url.com")
```

## 获取测试网络的 SOL

在测试网络上进行交易需要测试 SOL，可以通过以下方式获取：

1. 访问 Solana 官方测试水龙头：https://faucet.solana.com/
2. 输入您的 Solana 地址
3. 点击 "Request SOL" 按钮
4. 稍等片刻，测试 SOL 将发送到您的地址

## 运行程序

### 查询区块信息

默认情况下，程序会查询指定区块号的信息。运行以下命令启动程序：

```bash
go run main.go
```

程序会输出区块的哈希、时间戳、交易数量等信息。

### 发送交易

要发送交易，需要进行以下操作：

1. 准备一个 Solana 账户的私钥（请确保这是测试网络的账户）
2. 在 `main.go` 文件中，取消注释发送交易的代码块
3. 替换示例中的私钥和接收地址
4. 调整转账金额（以 lamports 为单位，1 SOL = 1,000,000,000 lamports）

```go
// 发送交易示例
fmt.Println("\n正在发送交易...")
// 发送方私钥（替换为您的私钥）
senderPrivateKey := "YOUR_PRIVATE_KEY_HERE"
// 接收方地址（替换为接收方地址）
receiverAddress := "RECEIVER_ADDRESS_HERE"
// 转账金额（以lamports为单位）
amount := uint64(1000000000) // 1 SOL
sendTransaction(rpcClient, senderPrivateKey, receiverAddress, amount)
```

5. 运行程序

```bash
go run main.go
```

程序会输出交易的哈希值、发送方、接收方和转账金额等信息。

## 代码结构说明

### main.go

- **queryBlockInfo**: 查询指定区块号的区块信息
  - 参数：rpcClient（RPC客户端）、blockNumber（区块号）
  - 功能：获取区块的哈希、时间戳、交易数量等信息并输出

- **sendTransaction**: 发送SOL转账交易
  - 参数：rpcClient（RPC客户端）、senderPrivateKey（发送方私钥）、receiverAddress（接收方地址）、amount（转账金额）
  - 功能：构造、签名并发送交易，输出交易哈希等信息

- **main**: 主函数，连接RPC并调用上述功能函数

## 注意事项

1. **安全问题**：
   - 不要在代码中硬编码私钥，建议从环境变量或安全的配置文件中读取
   - 不要将包含私钥的代码提交到版本控制系统
   - 仅在测试网络中使用测试账户，不要使用包含真实资产的账户

2. **错误处理**：
   - 程序中的错误处理较为简化，实际应用中应根据需要进行更详细的错误处理

3. **区块号选择**：
   - 默认使用的区块号可能会随着网络的发展而变化，如果查询失败，可以尝试使用最新的区块号

4. **交易确认**：
   - 程序中没有包含交易确认的逻辑，实际应用中可以使用 `GetSignatureStatuses` 等方法来确认交易是否成功

## 参考资料

- [Solana 官方文档](https://docs.solana.com/)
- [gagliardetto/solana-go GitHub 仓库](https://github.com/gagliardetto/solana-go)
- [Solana 测试网络水龙头](https://faucet.solana.com/)