# Shib Meme Token (SHIBMEME)

一个基于以太坊区块链平台的SHIB风格Meme代币合约，实现了代币税机制、流动性池集成和交易限制功能。

## 已部署合约信息

- **合约地址**：0x36618c9fbbdbac1698ef296f2f83e9c1028d919f
- **部署网络**：Sepolia测试网
- **所有者地址**：0x74B5057e77D4F58CcC70bF1c7dc9f8405BCc72f0

## 功能特点

### 🔄 代币税功能
- 对每笔代币交易征收45%的税费
- 税费按50:50的比例分配给流动性池和项目金库
- 对流动性池交易和合约所有者交易免税，降低系统性摩擦

### 📊 流动性池集成
- 支持用户向流动性池添加流动性
- 提供流动性奖励机制
- 合约所有者可管理流动性池资金

### 🛡️ 交易限制功能
- 单笔交易最大额度：50亿 SHIBMEME
- 每日交易次数限制：10次/账户
- 防止恶意操纵市场和鲸鱼行为

### 📈 代币参数
- 代币名称：Shib Meme Token
- 代币符号：SHIBMEME
- 最大供应量：1万亿 SHIBMEME
- 小数位数：18位

## 技术栈

- **区块链平台**：以太坊
- **开发框架**：Hardhat 3
- **智能合约语言**：Solidity 0.8.28
- **依赖库**：OpenZeppelin Contracts 5.0
- **测试框架**：Viem + Chai
- **部署工具**：Hardhat Ignition

## 安装和部署

### 前提条件

- Node.js v16+ 和 npm v8+
- Git
- Hardhat CLI (可选)

### 安装步骤

1. **克隆仓库**

```bash
git clone <repository-url>
cd Contract_Code
```

2. **安装依赖**

```bash
npm install
```

3. **编译合约**

```bash
npx hardhat compile
```

4. **运行测试**

```bash
npx hardhat test
```

5. **部署合约到本地网络**

```bash
npx hardhat run scripts/deploy.ts
```

6. **部署合约到测试网络（Sepolia）**

首先配置环境变量：
- SEPOLIA_RPC_URL：Sepolia测试网RPC URL
- SEPOLIA_PRIVATE_KEY：部署者钱包私钥

然后执行部署命令：

```bash
npx hardhat run scripts/deploy.ts --network sepolia
```

## 使用指南

### 使用指南

### 与合约交互

使用提供的验证脚本与已部署的合约进行交互，测试合约功能：

```bash
node scripts/verify_contract.ts
```

### 验证脚本功能说明

验证脚本会测试以下合约功能：
1. 合约基本信息查询（名称、符号、小数位数等）
2. 代币余额查询
3. 合约配置参数查询（最大供应量、交易限制、税率等）
4. 地址配置查询（所有者、流动性池、金库地址）
5. 代币转账功能测试
6. 每日交易限制查询
7. 授权功能测试

1. **代币转账**
   - 使用`transfer`函数进行代币转账
   - 系统会自动计算并扣除交易税
   - 受交易限制功能约束

2. **添加流动性**
   - 使用`addLiquidity`函数向流动性池添加代币
   - 增加代币的市场流动性

3. **管理功能（仅所有者）**
   - `setTreasuryAddress`：更新金库地址
   - `removeLiquidity`：从流动性池移除代币

## 合约安全

- 所有关键函数都有适当的访问控制
- 使用OpenZeppelin的安全库实现基础功能
- 实现了防操纵机制（交易限制）
- 代码中添加了详细的注释和事件日志

## 测试覆盖

项目包含全面的测试用例，覆盖了以下方面：
- 代币基本功能测试
- 代币税功能测试
- 交易限制功能测试
- 流动性池集成测试
- 边界条件测试