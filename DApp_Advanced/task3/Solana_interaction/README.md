# Solana Go 区块链交互项目

## 项目简介
这是一个基于Go语言和Solana Go SDK实现的区块链交互项目，提供与Solana区块链的基础交互功能。

## 功能特性
1. **区块数据查询** - 根据区块高度或区块哈希查询区块详细信息
2. **账户余额查询** - 通过钱包地址查询SOL余额
3. **原生SOL转账** - 实现Solana网络上的SOL代币转账功能
4. **WebSocket账户监控** - 通过WebSocket连接监控特定账户的状态变更

## 技术栈
- Go 1.23.11
- Solana Go SDK (github.com/gagliardetto/solana-go)

## 项目结构
```
solana-interaction/
├── go.mod         # Go模块定义文件
├── go.sum         # 依赖版本锁定文件
├── main.go        # 主程序文件，包含所有核心功能实现
└── README.md      # 项目说明文档
```

## 安装依赖
项目使用Go模块管理依赖，安装步骤如下：

```bash
# 克隆项目（如需）
# git clone <项目地址>

# 进入项目目录
cd solana-interaction

# 安装依赖
go mod tidy
```

## 核心功能说明

### 1. 创建Solana RPC客户端
连接到Solana测试网络（Devnet），默认使用`https://api.devnet.solana.com`端点。

### 2. 区块数据查询
函数：`getBlockByHeightOrHash(ctx context.Context, client *rpc.Client, identifier interface{})`

参数：
- `ctx`: 上下文对象
- `client`: Solana RPC客户端
- `identifier`: 区块标识符（uint64类型的高度或string类型的哈希）

返回值：
- 区块详细信息和可能的错误

### 3. WebSocket账户监控
函数：`createWebSocketSubscription(ctx context.Context) (*ws.Client, error)`

功能说明：
- 建立与Solana开发网的WebSocket连接
- 设置特定账户（8WSxggj7axfcrF9A36XN7gnpdRDLWBJos7XitJmSBJHV）的状态监控
- 在账户余额、数据或所有者发生变化时提供通知

参数：
- `ctx`: 上下文对象，用于控制连接生命周期

返回值：
- WebSocket客户端实例和可能的错误

### 4. 账户余额查询
函数：`getAccountBalance(ctx context.Context, client *rpc.Client, address string)`

参数：
- `ctx`: 上下文对象
- `client`: Solana RPC客户端
- `address`: 钱包地址（Base58格式字符串）

返回值：
- 账户余额（以lamports为单位）和可能的错误

### 5. 原生SOL转账
函数：`transferSOL(ctx context.Context, client *rpc.Client, fromPrivateKey string, toAddress string, amount uint64)`

参数：
- `ctx`: 上下文对象
- `client`: Solana RPC客户端
- `fromPrivateKey`: 发送者私钥（Base58格式字符串）
- `toAddress`: 接收者地址（Base58格式字符串）
- `amount`: 转账金额（以lamports为单位，1 SOL = 10^9 lamports）

返回值：
- 交易签名（字符串形式）和可能的错误

## 使用示例

### 1. WebSocket账户监控示例
```go
// 创建带超时的上下文
ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
defer cancel()

// 创建WebSocket订阅
wsClient, err := createWebSocketSubscription(ctx)
if err != nil {
    log.Fatalf("创建WebSocket订阅失败: %v", err)
}

// 保持程序运行一段时间以接收事件
fmt.Println("等待接收WebSocket事件日志...")
time.Sleep(5 * time.Second)

// 程序结束时，通过取消上下文自动关闭WebSocket连接
```

### 2. 区块查询示例
```go
// 通过高度查询区块
block, err := getBlockByHeightOrHash(ctx, client, uint64(123456789))
if err != nil {
    log.Fatalf("查询区块失败: %v", err)
}
fmt.Printf("区块高度: %d, 交易数量: %d\n", block.Slot, len(block.Transactions))

// 通过哈希查询区块
block, err = getBlockByHeightOrHash(ctx, client, "5sVQ7aC7x7...") // 实际区块哈希
```

### 3. 余额查询示例
```go
address := "9vGgxL8a..." // 实际钱包地址
balance, err := getAccountBalance(ctx, client, address)
if err != nil {
    log.Fatalf("查询余额失败: %v", err)
}
fmt.Printf("账户余额: %f SOL\n", float64(balance)/1000000000)
```

### 4. 转账示例
```go
// 注意：实际使用时，请妥善保管私钥，不要硬编码在代码中
fromPrivateKey := "your_private_key_here" // Base58格式的私钥
toAddress := "recipient_address_here"
amount := uint64(1000000000) // 1 SOL (1 SOL = 10^9 lamports)
	sig, err := transferSOL(ctx, client, fromPrivateKey, toAddress, amount)
if err != nil {
    log.Fatalf("转账失败: %v", err)
}
fmt.Printf("转账成功，交易签名: %s\n", sig)
```

## 注意事项
1. **安全提示**：在实际应用中，请不要将私钥直接硬编码在代码中，应使用环境变量或安全的密钥管理系统。
2. **网络选择**：项目默认使用Solana Devnet测试网络，如需连接到主网，请修改RPC端点。
3. **错误处理**：所有函数都包含完善的错误处理机制，请确保正确处理返回的错误。
4. **交易费用**：Solana网络上的交易需要支付少量费用，确保发送账户有足够的余额支付费用。

## 开发环境要求
- Go 1.18或更高版本
- 网络连接（用于连接Solana RPC端点）

## 资源链接
- [Solana官方文档](https://docs.solana.com/)
- [Solana Go SDK GitHub仓库](https://github.com/gagliardetto/solana-go)
- [Solana区块浏览器](https://explorer.solana.com/)