# 以太坊智能合约Go交互示例

这个项目演示了如何使用Go语言与部署在Sepolia测试网络上的Counter智能合约进行交互。

## 准备工作

1. **获取Infura项目ID**：
   - 访问 [Infura](https://infura.io/) 注册账户
   - 创建一个新的项目，获取项目ID

2. **准备以太坊钱包**：
   - 可以使用MetaMask创建一个新钱包
   - 获取钱包的私钥（注意安全保管）
   - 向钱包中添加一些Sepolia测试ETH（可以通过 faucets.chain.link 等 faucet 获取）

3. **部署智能合约**：
   - 使用Remix或其他工具将Counter.sol部署到Sepolia测试网络
   - 记录部署后的合约地址

3. **solc编译智能合约**：
   - 使用solc编译Counter.sol合约
   ```
   npm run genbin
   npm run genabi
   ```
   - 记录编译后的合约ABI和字节码
   - 运行以下代码，生成Counter.go文件
   ```
   abigen --bin=Counter_sol_Counter.bin --abi=Counter_sol_Counter.abi --pkg=Counter --out=Counter.go
   ```

## 配置项目

1. 打开 `main.go` 文件，替换以下占位符：
   - `YOUR_INFURA_PROJECT_ID`: 你的Infura项目ID
   - `YOUR_PRIVATE_KEY`: 你的以太坊钱包私钥
   - `YOUR_CONTRACT_ADDRESS`: 部署后的合约地址

## 运行项目

1. 确保已经安装了所有依赖：
```bash
# 初始化并下载依赖
go mod tidy
```

2. 运行程序：
```bash
# 运行main.go
go run main.go
```

## 功能说明

这个程序会：
1. 连接到Sepolia测试网络
2. 使用提供的私钥创建交易签名器
3. 实例化Counter合约
4. 调用increment方法增加计数器的值
5. 输出交易哈希
6. 读取并输出当前计数器的值

## 注意事项

- 确保私钥的安全，不要将其提交到代码仓库中
- 测试网络上的ETH没有实际价值，仅用于测试
- 本示例中的gas设置是基本的，可能需要根据网络状况调整
- 交易可能需要一些时间才能确认，可以在Etherscan上查看交易状态