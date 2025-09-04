# Chainlink Price Consumer项目

## 项目概述

这是一个使用Hardhat开发的智能合约项目，通过Chainlink预言机实现ETH价格订阅功能，并支持价格阈值触发。

### 主要功能
1. 通过Chainlink预言机获取实时ETH/USD价格
2. 支持设置价格阈值，当价格超过或低于阈值时触发事件
3. 提供完整的部署脚本，可部署到Sepolia测试网
4. 包含测试脚本验证合约功能和事件监听

## 项目结构

```
├── contracts/
│   └── PriceConsumer.sol  # 主要的Chainlink价格消费者合约
├── scripts/
│   ├── deploy.js          # 部署脚本
│   └── testPriceConsumer.js # 合约功能测试脚本
├── test/
│   └── PriceConsumer.test.js # 单元测试文件
├── ignition/
│   └── modules/
│       └── Lock.js       # Hardhat Ignition配置
├── hardhat.config.js      # Hardhat配置文件
├── package-lock.json      # 依赖版本锁定文件
├── package.json           # 项目配置和依赖
├── .gitignore             # Git忽略文件配置
└── README.md              # 项目说明文档
```

## 快速开始

### 1. 安装依赖

```shell
npm install
```

### 2. 配置环境变量

创建一个`.env`文件并填写以下配置：

```
# Sepolia测试网RPC URL（可从Alchemy、Infura等获取）
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/your-api-key

# 部署合约的钱包私钥（请使用测试网钱包，不要使用主网钱包）
PRIVATE_KEY=your-private-key

# Etherscan API密钥（用于合约验证）
ETHERSCAN_API_KEY=your-etherscan-api-key

# Chainlink ETH/USD价格Feed地址（Sepolia测试网）
CHAINLINK_ETH_USD_PRICE_FEED=0x694AA1769357215DE4FAC081bf1f309aDC325306
```

注意：请确保将`.env`文件添加到`.gitignore`中，避免泄露敏感信息。

### 3. 编译合约

```shell
npx hardhat compile
```

### 4. 部署到Sepolia测试网

```shell
npx hardhat run scripts/deploy.js --network sepolia
```

### 5. 验证合约（可选）

```shell
npx hardhat verify --network sepolia [合约地址] [价格Feed地址]
```

### 6. 运行功能测试脚本

```shell
npx hardhat run scripts/testPriceConsumer.js --network sepolia
```

## Chainlink配置说明

### 1. Chainlink价格Feed地址

在本项目中，我们使用Chainlink的ETH/USD价格Feed来获取实时价格数据。在Sepolia测试网上，ETH/USD价格Feed的地址是：

```
0x694AA1769357215DE4FAC081bf1f309aDC325306
```

这个地址已在`.env`文件中预设，通常无需修改。如果您需要使用其他资产的价格Feed或其他网络，请参考[Chainlink文档](https://docs.chain.link/data-feeds/price-feeds/addresses)查找相应地址。

### 2. 价格Feed的工作原理

Chainlink价格Feed是一个聚合合约，它会从多个预言机节点收集价格数据，然后通过聚合算法计算出最终的价格。价格数据会定期更新（通常每几分钟）。

在`PriceConsumer`合约中，我们通过调用`AggregatorV3Interface`接口的`latestRoundData()`函数来获取最新价格：

```solidity
(,
int256 price,
,
uint256 timestamp,
) = priceFeed.latestRoundData();
```

### 3. 价格精度说明

Chainlink的ETH/USD价格Feed返回的价格数据带有8位小数。例如，如果返回的价格是`200000000000`，则实际价格是`2000.00000000` USD。

## 使用指南

### 1. 获取实时ETH价格

调用`getLatestPrice()`函数来获取当前的ETH价格：

```solidity
uint256 price = priceConsumer.getLatestPrice();
```

此函数会更新合约中的`lastPrice`和`lastPriceTimestamp`状态变量，并触发`PriceUpdated`事件。

### 2. 设置价格阈值

调用`setPriceThreshold(uint256 threshold)`函数来设置价格阈值：

```solidity
priceConsumer.setPriceThreshold(200000000000); // 设置2000 USD为阈值
```

此函数会触发`PriceThresholdSet`事件。

### 3. 检查价格阈值

当调用`getLatestPrice()`时，合约会自动调用`checkPriceThreshold()`函数检查当前价格是否超过或低于阈值。您也可以手动调用此函数：

```solidity
priceConsumer.checkPriceThreshold();
```

如果价格超过阈值，会触发`PriceThresholdExceeded`事件；如果价格低于阈值，会触发`PriceThresholdBelow`事件。

### 4. 查询合约信息

- `getDecimals()`: 获取价格Feed的小数位数
- `getDescription()`: 获取价格Feed的描述
- `getLatestRoundData()`: 获取完整的最新价格数据

## 合约事件监听

您可以通过Web3.js或Ethers.js来监听合约事件，testPriceConsumer.js脚本已实现了完整的事件监听功能，包括：

```javascript
// 监听价格更新事件
priceConsumer.on('PriceUpdated', (price, timestamp) => {
  console.log(`价格更新: $${price / 1e8}`);
  console.log(`时间戳: ${timestamp}`);
});

// 监听价格阈值触发事件
priceConsumer.on('PriceThresholdExceeded', (currentPrice, threshold) => {
  console.log(`价格超过阈值: $${currentPrice / 1e8} > $${threshold / 1e8}`);
});

// 监听价格阈值设置事件
priceConsumer.on('PriceThresholdSet', (threshold) => {
  console.log(`价格阈值已设置: $${threshold / 1e8}`);
});

// 监听价格低于阈值事件
priceConsumer.on('PriceThresholdBelow', (currentPrice, threshold) => {
  console.log(`价格低于阈值: $${currentPrice / 1e8} < $${threshold / 1e8}`);
});
```

## 安全注意事项

1. 请不要在生产环境中使用未经验证的代码
2. 确保使用安全的RPC节点和钱包
3. 不要将主网私钥用于测试环境
4. 定期检查Chainlink价格Feed的状态和更新

## 常见问题

### 1. 为什么获取的价格为0？

可能的原因：
- Chainlink价格Feed合约地址不正确
- 网络连接问题
- 价格Feed合约可能暂时不可用

### 2. 如何切换到其他网络？

在`hardhat.config.js`文件中添加新的网络配置，并在`scripts/deploy.js`中更新相应的价格Feed地址。

### 3. 如何获取其他加密货币的价格？

修改合约中的价格Feed地址，使用相应加密货币的Chainlink价格Feed。

## 参考资料

- [Hardhat文档](https://hardhat.org/docs)
- [Chainlink数据Feed文档](https://docs.chain.link/data-feeds)
- [Etherscan Sepolia](https://sepolia.etherscan.io/)

## 已部署合约信息

合约已成功部署到Sepolia测试网并通过Etherscan验证。

- 合约地址: `0xcd0466e19bc2Dde5b1EabcA7f4Ba3cCCcF0169e7`
- Etherscan验证页面: [https://sepolia.etherscan.io/address/0xcd0466e19bc2Dde5b1EabcA7f4Ba3cCCcF0169e7#code](https://sepolia.etherscan.io/address/0xcd0466e19bc2Dde5b1EabcA7f4Ba3cCCcF0169e7#code)
