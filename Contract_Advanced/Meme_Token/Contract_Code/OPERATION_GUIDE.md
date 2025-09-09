# Shib Meme Token (SHIBMEME) 操作指南

本指南详细介绍如何部署和使用Shib Meme Token合约，包括环境配置、合约部署、代币交易、流动性管理等操作步骤。

## 已部署合约信息

- **合约地址**：0x36618c9fbbdbac1698ef296f2f83e9c1028d919f
- **部署网络**：Sepolia测试网
- **所有者地址**：0x74B5057e77D4F58CcC70bF1c7dc9f8405BCc72f0

## 目录

- [1. 环境准备](#1-环境准备)
- [2. 合约部署](#2-合约部署)
  - [2.1 本地测试网络部署](#21-本地测试网络部署)
  - [2.2 Sepolia测试网络部署](#22-sepolia测试网络部署)
  - [2.3 主网部署](#23-主网部署)
- [3. 代币交易操作](#3-代币交易操作)
  - [3.1 查看代币余额](#31-查看代币余额)
  - [3.2 执行代币转账](#32-执行代币转账)
  - [3.3 交易税说明](#33-交易税说明)
- [4. 流动性管理](#4-流动性管理)
  - [4.1 添加流动性](#41-添加流动性)
  - [4.2 移除流动性（仅所有者）](#42-移除流动性仅所有者)
- [5. 合约管理（仅所有者）](#5-合约管理仅所有者)
  - [5.1 更新金库地址](#51-更新金库地址)
  - [5.2 查询合约参数](#52-查询合约参数)
- [6. 常见问题与解决方案](#6-常见问题与解决方案)
- [7. 附录：常用命令速查](#7-附录常用命令速查)

## 1. 环境准备

在开始之前，请确保您已安装以下软件：

- **Node.js v16+ 和 npm v8+**：[下载安装](https://nodejs.org/)
- **Git**：[下载安装](https://git-scm.com/downloads)
- **MetaMask钱包**（用于测试网络和主网操作）：[下载安装](https://metamask.io/download/)

### 安装依赖

克隆项目代码并安装依赖：

```bash
git clone <repository-url>
cd Contract_Code
npm install
```

## 2. 合约部署

### 2.1 本地测试网络部署

在本地Hardhat网络上部署合约用于开发和测试：

1. **启动本地Hardhat网络**（可选）：

```bash
npx hardhat node
```

2. **部署合约**：

```bash
npx hardhat run scripts/deploy.ts
```

部署成功后，控制台将显示合约地址和其他部署信息。

### 2.2 Sepolia测试网络部署

在Sepolia测试网络上部署合约，用于公开测试：

1. **配置环境变量**：

创建一个 `.env` 文件在项目根目录，并添加以下内容：

```
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_PROJECT_ID
SEPOLIA_PRIVATE_KEY=YOUR_WALLET_PRIVATE_KEY
```

2. **获取Sepolia测试ETH**：

通过[Sepolia水龙头](https://sepoliafaucet.com/)获取测试ETH用于支付部署费用。

3. **部署合约到Sepolia**：

```bash
npx hardhat run scripts/deploy.ts --network sepolia
```

### 2.3 主网部署

在以太坊主网上部署合约（生产环境）：

1. **配置环境变量**：

```
MAINNET_RPC_URL=https://mainnet.infura.io/v3/YOUR_INFURA_PROJECT_ID
MAINNET_PRIVATE_KEY=YOUR_WALLET_PRIVATE_KEY
```

2. **修改hardhat.config.ts**，添加主网配置：

```typescript
networks: {
  // 现有配置...
  mainnet: {
    type: "http",
    chainType: "l1",
    url: configVariable("MAINNET_RPC_URL"),
    accounts: [configVariable("MAINNET_PRIVATE_KEY")],
  },
}
```

3. **部署合约到主网**：

```bash
npx hardhat run scripts/deploy.ts --network mainnet
```

## 3. 代币交易操作

### 3.1 查看代币余额

使用MetaMask查看代币余额：

1. 在MetaMask中点击"资产"标签页
2. 点击"添加代币"按钮
3. 选择"自定义代币"，输入代币合约地址
4. MetaMask会自动识别代币名称和符号，点击"下一步"完成添加

使用命令行查看余额和合约信息：

```bash
node scripts/verify_contract.ts
```

### 3.2 执行代币转账

**使用MetaMask转账**：

1. 在MetaMask中选择SHIBMEME代币
2. 点击"发送"按钮
3. 输入接收者地址和转账金额
4. 确认交易并支付Gas费

**使用命令行转账**：

运行验证脚本，其中包含转账测试功能：

```bash
node scripts/verify_contract.ts
```

### 3.3 交易税说明

- 每笔普通交易将收取45%的税费
- 税费会自动分配：50%进入流动性池，50%进入项目金库
- 以下交易类型免税：
  - 与流动性池之间的交易
  - 合约所有者发起的交易
- 实际到账金额 = 转账金额 - 税费金额

## 4. 流动性管理

### 4.1 添加流动性

任何人都可以向流动性池添加SHIBMEME代币：

**使用命令行添加流动性**：

目前需要通过合约直接交互或自定义脚本实现。

**使用合约直接交互**：

1. 在区块链浏览器（如Etherscan）上打开合约页面
2. 切换到"合约"标签页，然后点击"Write Contract"或"Write as Proxy"
3. 连接您的MetaMask钱包
4. 选择`addLiquidity`函数，输入要添加的代币数量
5. 点击"Write"并确认交易

### 4.2 移除流动性（仅所有者）

只有合约所有者可以从流动性池移除代币：

1. 在区块链浏览器上打开合约页面
2. 切换到"合约"标签页，点击"Write Contract"
3. 连接所有者钱包
4. 选择`removeLiquidity`函数，输入要移除的代币数量
5. 点击"Write"并确认交易

## 5. 合约管理（仅所有者）

### 5.1 更新金库地址

合约所有者可以更新接收税费的金库地址：

1. 在区块链浏览器上打开合约页面
2. 切换到"合约"标签页，点击"Write Contract"
3. 连接所有者钱包
4. 选择`setTreasuryAddress`函数，输入新的金库地址
5. 点击"Write"并确认交易

### 5.2 查询合约参数

使用区块链浏览器查询合约参数：

1. 在区块链浏览器上打开合约页面
2. 切换到"合约"标签页，点击"Read Contract"
3. 可以查询各种合约参数，如：
   - `MAX_SUPPLY`: 代币最大供应量
   - `MAX_TRANSACTION_AMOUNT`: 单笔最大交易金额
   - `MAX_DAILY_TRANSACTIONS`: 每日最大交易次数
   - `TAX_RATE`: 交易税率
   - `liquidityPoolAddress`: 流动性池地址
   - `treasuryAddress`: 金库地址

## 6. 常见问题与解决方案

### Q: 转账失败提示"Transaction amount exceeds maximum"怎么办？
A: 您尝试转账的金额超过了单笔交易最大限制（50亿SHIBMEME），请减少转账金额。

### Q: 转账失败提示"Daily transaction limit exceeded"怎么办？
A: 您今天的交易次数已达到每日限制（10次），请明天再尝试转账。

### Q: 为什么我实际收到的代币数量比对方转账的少？
A: 因为系统对每笔交易收取了5%的税费，税费会自动分配给流动性池和金库。

### Q: 如何验证合约是否已成功部署？
A: 可以在区块链浏览器上搜索合约地址，如果能看到合约代码和交易记录，则表示部署成功。

### Q: 添加流动性后如何获得收益？
A: 作为流动性提供者，您将从交易税费中获得持续的收益。具体的收益分配机制可能需要配合前端界面来实现。

## 7. 附录：常用命令速查

| 命令 | 说明 |
|------|------|
| `npx hardhat compile` | 编译智能合约 |
| `npx hardhat test` | 运行测试用例 |
| `npx hardhat node` | 启动本地开发网络 |
| `npx hardhat run scripts/deploy.ts` | 在本地网络部署合约 |
| `npx hardhat run scripts/deploy.ts --network sepolia` | 在Sepolia网络部署合约 |
| `npx hardhat run scripts/interact.ts --network <network>` | 与已部署的合约交互 |