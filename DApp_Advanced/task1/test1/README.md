# Sepolia 测试网络交互项目

这个项目是一个基于Go语言的应用程序，用于与以太坊Sepolia测试网络进行交互。它实现了两个主要功能：查询区块信息和发送交易。

## 环境搭建

### 1. 安装Go语言环境

请从官方网站下载并安装Go语言环境：
https://golang.org/dl/

安装完成后，验证Go是否安装成功：
```bash
go version
```

### 2. 安装依赖

项目依赖以下库：
- go-ethereum: 以太坊Go客户端库
- godotenv: 环境变量加载库

这些依赖已在go.mod文件中定义，执行以下命令安装：
```bash
go mod tidy
```

### 3. 注册Infura账户

1. 访问 https://infura.io/ 并注册一个账户
2. 创建一个新的项目
3. 在项目设置中获取Sepolia测试网络的API密钥

### 4. 准备Sepolia测试网络账户

1. 使用MetaMask或其他以太坊钱包创建一个账户
2. 切换到Sepolia测试网络
3. 获取一些Sepolia测试ETH（可以通过水龙头获取）
4. 导出账户的私钥

## 配置

1. 复制`.env.example`文件并重命名为`.env`（本项目已直接创建.env文件）
2. 在`.env`文件中填写以下信息：
   - INFURA_API_KEY: 你的Infura API密钥
   - PRIVATE_KEY: 你的以太坊账户私钥
   - RECIPIENT_ADDRESS: 接收交易的地址

## 运行项目

### 查询区块

项目默认会查询区块号为5500000的区块信息。你可以在`main.go`文件中修改`blockNumber`变量来查询不同的区块。

### 发送交易

项目会从你配置的账户中发送0.01 ETH到指定的接收地址。

### 执行程序

```bash
# 确保已经完成配置

go run main.go
```

## 代码说明

### 主要功能

1. **连接到Sepolia测试网络**：使用Infura API连接到Sepolia测试网络

2. **查询区块信息**：
   - 根据指定的区块号查询区块
   - 输出区块哈希、时间戳、交易数量等信息

3. **发送交易**：
   - 从环境变量加载私钥和接收地址
   - 构造并签名交易
   - 发送交易到网络并输出交易哈希

### 安全注意事项

- 不要将私钥硬编码到代码中
- 不要将包含私钥的.env文件提交到版本控制系统
- 测试完成后，建议使用新的账户和私钥

## 故障排除

1. **连接问题**：确保Infura API密钥正确，网络连接正常
2. **余额不足**：确保发送账户有足够的Sepolia测试ETH
3. **交易失败**：检查Gas价格和Gas限制设置，确保私钥和地址正确

## 参考资料

- Go语言官方文档: https://golang.org/doc/
- Ethereum官方文档: https://ethereum.org/en/developers/
- Go-Ethereum库文档: https://geth.ethereum.org/docs/