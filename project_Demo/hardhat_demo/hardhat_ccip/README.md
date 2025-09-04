# CCIP 跨链 Token 转账项目

本项目使用 Chainlink 的跨链互操作性协议 (CCIP) 实现在不同的区块链网络之间发送 ERC20 Token 的功能。

## 项目概述

该项目包含三个主要合约：
- `CrossChainTokenTransferSender`: 用于在源链上发送 ERC20 Token 到目标链
- `CrossChainTokenTransferReceiver`: 用于在目标链上接收来自源链的 Token
- `TestToken`: 一个简单的 ERC20 测试代币合约，用于测试 CCIP 跨链转账功能

## 安装指南

1. 克隆本项目后，安装依赖：

```shell
npm install
```

## 配置环境变量

在项目根目录创建 `.env` 文件，添加以下内容：

```
# 您的以太坊私钥（用于部署合约和发送交易）
PRIVATE_KEY=your_private_key

# Infura API Key（用于连接到测试网络）
INFURA_API_KEY=your_infura_api_key
```

## 合约部署流程

### 1. 编译合约

```shell
npx hardhat compile
```

### 2. 在 Sepolia 测试网部署合约

Sepolia 网络的 CCIP 路由器地址：`0x0BF3dE8c5D3e8A2B34D2BEeB17ABfCeBaf363A59`

```shell
npx hardhat ignition deploy ./ignition/modules/CCIPTokenTransfer.js --network sepolia --parameters "{\"CCIPTokenTransferModule\":{\"routerAddress\":\"0x0BF3dE8c5D3e8A2B34D2BEeB17ABfCeBaf363A59\"}}"
```

### 3. 在 Amoy 测试网部署合约

Amoy 网络的 CCIP 路由器地址：`0xC249632c2D40b9001FE907806902f63038B737Ab`

```shell
npx hardhat ignition deploy ./ignition/modules/CCIPTokenTransfer.js --network amoy --parameters "{\"CCIPTokenTransferModule\":{\"routerAddress\":\"0xC249632c2D40b9001FE907806902f63038B737Ab\"}}"
```

## TestToken 合约使用指南

`TestToken` 是一个简单的 ERC20 测试代币合约，专为测试 CCIP 跨链转账功能而设计。它提供了铸造、销毁和批量操作等功能，便于测试过程中获取和管理测试代币。

### TestToken 合约特点

- 完全兼容 ERC20 标准接口
- 支持自定义代币名称、符号和初始供应量
- 合约所有者可以随时铸造新代币
- 支持批量铸造代币给多个地址
- 支持用户销毁自己持有的代币

### 部署 TestToken 合约

#### 步骤1: 创建部署脚本目录（如果不存在）

如果项目中没有scripts目录，请先创建它：

```shell
mkdir scripts
```

#### 步骤2: 在Sepolia测试网部署TestToken

```shell
npx hardhat run scripts/deploy-test-token.js --network sepolia
```

#### 步骤3: 在Amoy测试网部署TestToken

```shell
npx hardhat run scripts/deploy-test-token.js --network amoy
```

部署脚本会自动完成以下操作：
- 使用指定网络部署TestToken合约
- 设置代币名称为"Test Token"，符号为"TTK"
- 初始供应量为10,000,000 TTK
- 输出合约地址和其他部署信息
- 尝试自动验证合约（如果网络支持）

### 使用 TestToken 进行 CCIP 测试

#### 步骤1: 部署 TestToken 合约

按照上述部署说明在 Sepolia 和 Amoy 测试网上部署 TestToken 合约。

#### 步骤2: 铸造更多代币（可选）

如果需要更多的测试代币，可以使用我们提供的 `mint-test-token.js` 脚本：

```shell
# 向指定地址铸造代币
npx hardhat run scripts/mint-test-token.js --network <NETWORK> --token <TOKEN_ADDRESS> --recipient <RECIPIENT_ADDRESS> --amount <AMOUNT>

# 示例（在 Sepolia 网络向指定地址铸造 1000 TTK）
npx hardhat run scripts/mint-test-token.js --network sepolia --token 0x1234567890123456789012345678901234567890 --recipient 0xabcdef0123456789abcdef0123456789abcdef01 --amount 1000
```

铸造脚本会自动：
- 检查调用者是否为合约所有者
- 验证地址格式
- 执行代币铸造
- 输出交易详情和接收者的新余额

#### 步骤3: 批准 CCIP 路由器花费代币

在发送跨链转账之前，需要批准 CCIP 路由器使用你的代币：

```shell
cast send <TOKEN_ADDRESS> "approve(address,uint256)(bool)" <ROUTER_ADDRESS> <AMOUNT_IN_WEI> --private-key <YOUR_PRIVATE_KEY> --rpc-url <RPC_URL>
```

#### 步骤4: 使用 Sender 合约发送跨链转账

按照前面的跨链转账流程，使用 Sender 合约发送 TestToken 代币。

## 跨链转账流程

### 1. 准备工作

- 在源链（如 Sepolia）部署 `CrossChainTokenTransferSender` 合约
- 在目标链（如 Amoy）部署 `CrossChainTokenTransferReceiver` 合约
- 确保源链上有足够的原生代币（ETH 或 MATIC）支付 CCIP 费用
- 确保源链上有要转账的 ERC20 Token 余额

### 2. 批准 Token 转账

在调用 `sendToken` 函数之前，需要先批准合约使用您的 Token：

```javascript
// 假设使用 ethers.js
const tokenContract = await ethers.getContractAt("IERC20", tokenAddress);
await tokenContract.approve(senderContract.address, amount);
```

### 3. 调用发送函数

使用 `sendToken` 函数发送跨链转账请求：

```javascript
// 假设使用 ethers.js
const senderContract = await ethers.getContractAt("CrossChainTokenTransferSender", senderAddress);
const tx = await senderContract.sendToken(
  destinationChainSelector, // 目标链选择器（如 Amoy 的选择器是 12532609583862916517n）
  receiverAddress,          // 目标链上的接收合约地址
  tokenAddress,             // 要转账的 Token 地址
  amount                    // 转账数量
);

// 等待交易确认
const receipt = await tx.wait();

// 获取消息 ID（用于追踪跨链消息）
const messageId = receipt.events.find(event => event.event === "TokensSent").args.messageId;
```

## 链选择器值

- Sepolia: `16015286601757825753n`
- Amoy: `12532609583862916517n`

## 重要注意事项

1. 确保在源链上有足够的原生代币支付 CCIP 费用
2. 确保在调用 `sendToken` 前已批准足够的 Token 金额
3. 跨链消息可能需要一定时间才能到达目标链
4. 请在测试环境中充分测试后再进行主网操作

## 可用命令

```shell
# 帮助信息
npx hardhat help

# 运行测试
npx hardhat test

# 启动本地节点
npx hardhat node

# 部署合约到指定网络
npx hardhat ignition deploy ./ignition/modules/CCIPTokenTransfer.js --network <network>
```
