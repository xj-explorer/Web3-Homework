# Sample Hardhat Project

# MetaNode Dex 项目

这是一个去中心化交易所(DEX)项目，实现了类似于Uniswap V3的自动做市商(AMM)功能。项目包含以下核心合约：
- **PoolManager**: 管理所有交易对和流动性池
- **SwapRouter**: 处理代币交换交易
- **PositionManager**: 管理流动性仓位(NFT)
- **Factory**: 工厂合约，用于创建和管理交易池
- **Pool**: 具体的流动性池实现

## 项目结构

```
├── .gitignore
├── README.md
├── contracts/
│   ├── MetaNodeSwap/
│   │   ├── Factory.sol
│   │   ├── Pool.sol
│   │   ├── PoolManager.sol
│   │   ├── PositionManager.sol
│   │   ├── SwapRouter.sol
│   │   ├── interfaces/
│   │   ├── libraries/
│   │   └── test-contracts/
│   └── MyToken.sol
├── hardhat.config.ts
├── ignition/
│   └── modules/
│       ├── MNToken.ts
│       ├── MetaNodeSwap.ts
│       └── MyToken.ts
├── package-lock.json
├── package.json
├── run-coverage.bat
├── scripts/
│   ├── deploy-dex.ts
│   └── test-deploy.ts
├── test/
│   ├── MetaNodeSwap/
│   │   ├── Factory.ts
│   │   ├── Pool.ts
│   │   ├── PoolManager.ts
│   │   ├── PositionManager.ts
│   │   └── SwapRouter.ts
│   └── MyToken.ts
└── tsconfig.json
```

- `contracts/`: 智能合约源代码，包含核心DEX功能实现
- `scripts/`: 部署和验证脚本，用于部署合约和测试功能
- `test/`: 测试文件，包含各合约的单元测试
- `hardhat.config.ts`: Hardhat配置文件
- `ignition/`: Hardhat Ignition模块，用于高级部署配置

## 环境准备

1. 安装依赖：
```shell
npm install
```

2. 创建 `.env` 文件并配置环境变量：
```env
# 网络配置
SEPOLIA_URL=https://sepolia.infura.io/v3/your-infura-project-id
PRIVATE_KEY=your-private-key

# 合约地址配置 - 部署后填写
POOL_MANAGER_ADDRESS=
SWAP_ROUTER_ADDRESS=
POSITION_MANAGER_ADDRESS=

# Etherscan配置（用于合约验证）
ETHERSCAN_API_KEY=
```

## 部署合约

### 简化版部署（快速测试）

使用简化版部署脚本快速部署到Sepolia测试网：
```shell
npx hardhat run scripts/test-deploy.ts --network sepolia
```

此脚本会自动部署PoolManager、SwapRouter和PositionManager合约，并进行基本功能测试。

### 完整部署

使用完整部署脚本部署到Sepolia测试网：
```shell
npx hardhat run scripts/deploy-dex.ts --network sepolia
```

部署后，将返回的合约地址更新到 `.env` 文件中。

## 验证合约功能

### 1. PoolManager验证脚本
验证PoolManager合约的创建池、查询池信息等功能。

```shell
npx hardhat run scripts/verify-pool-manager.ts --network sepolia
```

### 2. PositionManager验证脚本
验证PositionManager合约的流动性管理功能，包括创建仓位、销毁仓位和收取费用等。

```shell
npx hardhat run scripts/verify-position-manager.ts --network sepolia
```

## 注意事项

1. 运行验证脚本前，请确保 `.env` 文件中已正确配置合约地址
2. 验证脚本会在测试网上创建实际的交易和合约调用，可能产生Gas费用
3. 确保部署账户有足够的测试网ETH用于Gas费用
4. 验证脚本可能依赖于已部署的测试代币合约
5. 若要使用Sepolia测试网，需要在.env文件中配置有效的SEPOLIA_URL和PRIVATE_KEY

## 其他Hardhat命令

```shell
# 查看帮助
npx hardhat help

# 运行测试
npx hardhat test

# 运行带Gas报告的测试
REPORT_GAS=true npx hardhat test

# 启动本地开发节点
npx hardhat node

# 部署到本地节点
npx hardhat run scripts/deploy-dex.ts --network hardhat

# 运行测试覆盖率（Windows系统）
# 使用批处理文件
运行 ./run-coverage.bat


# 或直接使用命令
npx hardhat coverage

# 生成测试覆盖率报告
# 报告将生成在coverage文件夹中，打开index.html查看详细报告
```

## 测试覆盖率说明

测试覆盖率功能可以帮助您了解测试用例对代码的覆盖情况，包括：
- 行覆盖率：测试覆盖的代码行数比例
- 函数覆盖率：测试覆盖的函数比例
- 分支覆盖率：测试覆盖的条件分支比例

运行测试覆盖率后，可以在项目根目录的`coverage`文件夹中查看详细的HTML格式报告。

对于Windows用户，项目提供了`run-coverage.bat`批处理文件，可以快速运行覆盖率测试。
