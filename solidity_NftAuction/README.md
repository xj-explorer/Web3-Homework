# NFT拍卖市场

这是一个基于Hardhat框架开发的NFT拍卖市场，支持以下功能：
- NFT的铸造和转移
- ERC20代币的创建和转账
- NFT拍卖（支持ETH和ERC20代币出价）
- Chainlink预言机集成，实现价格比较
- UUPS代理模式实现合约升级
- Uniswap V2风格的工厂模式管理拍卖
- 批量拍卖升级功能

## 项目结构

```
├── .gitignore              # Git忽略文件
├── DEPLOY_TO_SEPOLIA.md    # Sepolia部署指南
├── README.md               # 项目文档
├── contracts/              # 智能合约
│   ├── MyNFT.sol           # ERC721 NFT合约
│   ├── MyERC20.sol         # ERC20代币合约
│   ├── Auction.sol         # 拍卖合约（UUPS升级模式）
│   ├── AuctionV2.sol       # 拍卖合约V2版本
│   ├── AuctionFactory.sol  # 拍卖工厂合约
│   ├── AuctionFactoryV2.sol # 拍卖工厂合约V2版本
│   └── mock/               # 模拟合约
│       └── MockV3Aggregator.sol # Chainlink价格预言机模拟
├── deploy/                 # 部署脚本
│   ├── 01-deploy-nft.js    # 部署NFT合约
│   ├── 02-deploy-erc20.js  # 部署ERC20合约
│   ├── 03-deploy-auction-upgradeable.js # 部署可升级版本Auction合约
│   ├── 04-deploy-factory-upgradeable.js # 部署可升级版本AuctionFactory合约
│   ├── 05-upgrade-auction-to-v2.js # 将Auction合约升级到V2版本
│   ├── 06-upgrade-factory-to-v2.js # 将AuctionFactory合约升级到V2版本
│   └── 07-upgrade-all-auctions.js # 批量升级所有拍卖合约
├── test/                   # 测试脚本
│   ├── nft.test.js         # 测试NFT合约
│   ├── erc20.test.js       # 测试ERC20合约
│   ├── auction.test.js     # 测试拍卖合约
│   ├── factory.test.js     # 测试工厂合约
│   ├── upgrade.test.js     # 测试合约升级功能
│   ├── factory-upgrade.test.js # 测试工厂升级功能
│   └── batch-upgrade.test.js # 测试批量升级功能
├── hardhat.config.js       # Hardhat配置文件
├── package-lock.json       # 依赖锁文件
└── package.json            # 项目依赖
```

## 功能说明

### 1. NFT合约 (MyNFT.sol)
- 基于ERC721标准实现
- 支持NFT铸造和转移
- 只有合约拥有者可以铸造NFT
- 支持NFT元数据URI设置

### 2. ERC20代币合约 (MyERC20.sol)
- 基于ERC20标准实现
- 初始供应量为1,000,000代币
- 只有合约拥有者可以铸造新代币
- 支持代币转账和授权

### 3. 拍卖合约 (Auction.sol)
- 支持创建拍卖、出价、结束拍卖和取消拍卖
- 支持ETH和ERC20代币出价
- 动态手续费计算：根据拍卖金额调整手续费率
- 集成Chainlink预言机，获取ETH和ERC20代币的美元价格
- 采用UUPS代理模式实现可升级功能

### 4. 可升级拍卖合约 (AuctionV2.sol)
- 继承自Auction合约
- 兼容UUPS代理模式
- 新增最小出价增量百分比功能
- 支持升级后初始化新功能(reinitializer)
- 增加版本控制功能

### 5. 拍卖工厂合约 (AuctionFactory.sol)
- 基于Uniswap V2风格的工厂模式
- 管理多个拍卖合约实例
- 支持创建新的拍卖合约实例
- 可以部署非升级版本和可升级版本的拍卖合约
- 只有工厂合约拥有者可以创建新的拍卖合约

### 6. 拍卖工厂合约V2 (AuctionFactoryV2.sol)
- 继承自AuctionFactory合约
- 新增批量升级功能，支持同时升级多个拍卖合约
- 优化升级流程，确保升级安全可靠
- 增加升级日志记录功能

## 部署步骤

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

创建`.env`文件，添加以下环境变量：

```
SEPOLIA_URL=<你的Sepolia测试网节点URL>
PRIVATE_KEY=<你的钱包私钥>
```

### 3. 编译合约
```bash
npx hardhat compile
```

### 4. 部署可升级版本合约到测试网

```bash
npx hardhat deploy --network sepolia --tags Upgradeable
```

### 5. 将可升级合约升级到V2版本

```bash
npx hardhat deploy --network sepolia --tags Upgrade
```
测试报告：提交测试报告，包括测试覆盖率和测试结果。

### 7. 运行所有测试

```bash
npm run test
```

### 8. 运行特定测试

```bash
# 运行升级测试
npx hardhat test test/upgrade.test.js

# 运行工厂升级测试
npx hardhat test test/factory-upgrade.test.js

# 运行批量升级测试
npx hardhat test test/batch-upgrade.test.js

# 跳过批量升级测试
npx hardhat test test/auction.test.js test/erc20.test.js test/factory-upgrade.test.js test/factory.test.js test/nft.test.js test/upgrade.test.js
```

## 合约升级

### 单个合约升级
1. 修改合约代码
2. 编译合约
3. 部署新的实现合约
4. 执行升级脚本

```bash
npx hardhat deploy --tags Upgrade --network sepolia
```

### 批量升级拍卖合约
1. 确保拍卖工厂合约已升级到V2版本
2. 准备需要升级的拍卖合约列表
3. 执行批量升级脚本

```bash
npx hardhat deploy --tags BatchUpgrade --network sepolia
```

> 注意：升级脚本使用相应的标签参数执行，确保你的升级脚本中包含了正确的标签。

通过升级脚本会自动处理代理合约的upgradeTo调用，无需手动执行该步骤。


## 测试覆盖率

```bash
npx hardhat coverage
```

运行上述命令可以查看测试覆盖率报告。
