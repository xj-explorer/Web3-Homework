# MetaNode stake contract

# MetaNode质押系统

## 项目介绍

MetaNode质押系统是一个基于以太坊的DeFi应用，允许用户通过质押ETH或其他代币来获得MetaNode代币奖励。该系统使用OpenZeppelin的可升级代理模式实现合约可升级性，支持多质押池配置，并提供灵活的奖励计算机制。

## 项目结构

```
├── contracts/              # 智能合约源代码
│   ├── MetaNode.sol        # MetaNode ERC20代币合约
│   ├── MetaNodeStake.sol   # 可升级的质押奖励合约
│   └── ETHReceiver.sol     # ETH接收合约
├── scripts/                # 部署和交互脚本
│   ├── deploy_All.js       # 一键部署所有合约
│   ├── deploy_MetaNodeStake.js # 单独部署质押合约
│   ├── verify_AddPool.js   # 验证添加质押池功能
│   └── verify_StakeInteract.js # 验证与质押合约的交互
├── test/                   # 测试文件
│   ├── MetaNodeStake.test.js          # 基础功能测试
│   ├── MetaNodeStakeEdgeCases.test.js # 边缘情况测试
│   └── MetaNodeStakeExtended.test.js  # 扩展功能测试
├── ignition/               # Hardhat Ignition部署配置
│   └── modules/MetaNode.js # MetaNode代币部署模块
├── hardhat.config.js       # Hardhat配置文件
└── package.json            # 项目依赖配置
```

## 合约功能说明

### 1. MetaNodeToken.sol

- 基础的ERC20代币合约，作为质押奖励代币
- 初始供应量：10,000,000 MetaNode
- 代币符号：MetaNode
- 小数位：18

### 2. MetaNodeStake.sol

- 支持可升级的质押合约，实现UUPS代理模式
- 支持ETH和其他代币质押
- 多质押池配置，每个池可设置不同的权重和参数
- 区块奖励机制，根据区块产出MetaNode奖励
- 灵活的奖励计算和分配机制
- 质押、解除质押和奖励领取功能
- 管理员控制功能（暂停/恢复功能、更新参数等）

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 编译合约

```bash
npx hardhat compile
```

### 3. 部署合约

#### 3.1 一键部署所有合约到Sepolia测试网

```bash
npx hardhat run scripts/deploy_All.js --network sepolia
```

一键部署脚本会完成以下操作：
- 部署MetaNodeToken合约
- 部署MetaNodeStake可升级代理合约
- 初始化质押合约参数
- 将MetaNode代币转入质押合约
- 打印代理合约和实现合约地址

#### 3.2 单独部署质押合约（可选）

```bash
npx hardhat run scripts/deploy_MetaNodeStake.js --network sepolia
```

## 合约交互

### 1. 验证合约交互

使用提供的验证脚本来与已部署的合约进行交互：

```bash
npx hardhat run scripts/verify_StakeInteract.js --network sepolia
```

该脚本会执行以下操作：
- 连接到已部署的质押合约
- 获取质押池数量
- 获取当前区块号
- 查询指定用户的待领取奖励
- 获取MetaNode代币合约地址

### 2. 添加新质押池（管理员操作）

```bash
npx hardhat run scripts/verify_AddPool.js --network sepolia
```

## 运行测试

```bash
npx hardhat test
```

测试文件包含：
- 基础质押和奖励计算功能
- 边缘情况处理
- 扩展功能验证

## 配置环境变量

在部署到测试网或主网前，请确保配置好以下环境变量：

```
# .env文件示例
SEPOLIA_URL=https://sepolia.infura.io/v3/YOUR_PROJECT_ID
PRIVATE_KEY=YOUR_PRIVATE_KEY
```

## 注意事项

1. 部署前请确保已配置好Hardhat配置文件中的网络设置
2. 管理员操作需要使用部署合约的账户
3. 解除质押后有锁定期，请查看对应质押池的参数
4. 质押奖励会根据区块高度和质押权重计算

## 技术栈

- Solidity ^0.8.20
- Hardhat
- OpenZeppelin Contracts
- OpenZeppelin Upgrades

## License

MIT