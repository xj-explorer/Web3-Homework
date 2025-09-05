# NFT拍卖市场

# NFT拍卖市场项目

这是一个基于Solidity开发的NFT拍卖市场项目，支持NFT的铸造、拍卖和竞价功能，并集成了Chainlink预言机获取实时价格信息。项目采用工厂模式设计，通过AuctionFactory合约创建和管理多个NFTAuction实例。

## 功能特点

1. **NFT合约**：实现了增强版ERC721标准，支持NFT的铸造和转移，以及自定义元数据URI设置
2. **ERC20代币合约**：用于参与NFT拍卖的竞价
3. **拍卖合约**：支持创建拍卖、使用ETH或ERC20代币出价和结束拍卖功能
4. **工厂模式**：通过工厂合约创建和管理拍卖合约实例，并集中管理代币价格预言机信息
5. **价格预言机集成**：使用Chainlink的feedData预言机获取实时价格，方便用户比较不同代币的出价
6. **测试网配置**：完整支持Sepolia测试网部署和测试

## 项目结构

```
├── contracts/            # Solidity合约文件
│   ├── MyNFT.sol         # NFT合约（支持自定义元数据URI）
│   ├── AuctionToken.sol  # ERC20代币合约
│   ├── NFTAuction.sol    # 拍卖合约
│   ├── AuctionFactory.sol # 拍卖工厂合约（修复了价格预言机设置逻辑）
│   └── MockChainlinkAggregator.sol # 模拟Chainlink价格预言机（用于测试）
├── ignition/modules/     # 部署脚本
│   └── DeployContracts.js # 自定义部署脚本（已配置Sepolia测试网价格预言机）
├── test/                 # 测试文件
│   └── NFTAuction.test.js # 综合测试文件
├── hardhat.config.js     # Hardhat配置文件（已配置Sepolia测试网）
├── package.json          # 项目依赖配置
├── package-lock.json     # 依赖版本锁定文件
├── .gitignore            # Git忽略文件配置
└── README.md             # 项目说明文档
```

## 技术栈

- Solidity ^0.8.28
- Hardhat ^2.26.3
- OpenZeppelin Contracts ^5.0.0
- Chainlink Contracts ^1.4.0
- dotenv（用于环境变量管理）

## 安装和设置

1. **安装依赖**
   
```bash
npm install
```

2. **编译合约**
   
```bash
npx hardhat compile
```

3. **运行测试**
   
```bash
npx hardhat test
```

## 部署配置

### 环境变量设置

项目使用环境变量管理敏感配置。请创建`.env`文件并设置以下变量：

```
# Sepolia测试网RPC URL（可从Infura、Alchemy等服务获取）
SEPOLIA_RPC_URL="https://sepolia.infura.io/v3/YOUR_INFURA_PROJECT_ID"

# 部署合约的钱包私钥
PRIVATE_KEY="YOUR_PRIVATE_KEY_HERE"

# Etherscan API密钥（用于合约验证）
ETHERSCAN_API_KEY="YOUR_ETHERSCAN_API_KEY_HERE"
```

### Chainlink配置

项目已在`DeployContracts.js`中配置了Sepolia测试网的价格预言机地址：

```javascript
// ETH/USD价格预言机地址（Sepolia测试网）
const ethUsdPriceFeed = '0x694AA1769357215DE4FAC081bf1f309aDC325306';

// 代币价格预言机地址（使用Sepolia测试网的EUR/USD作为示例）
const tokenUsdPriceFeed = '0x1a81afB8146aeFfCFc5E50e8479e826E7D55b910';
```

如需在其他网络部署，请访问[Chainlink Price Feeds文档](https://docs.chain.link/data-feeds/price-feeds/addresses)获取对应网络的价格预言机地址。

## 部署到Sepolia测试网

```bash
npx hardhat ignition deploy ./ignition/modules/DeployContracts.js --network sepolia
```

## 部署到本地网络

```bash
npx hardhat node
npx hardhat ignition deploy ./ignition/modules/DeployContracts.js --network localhost
```

## 合约功能说明

### MyNFT合约（增强版ERC721）

除了标准的ERC721功能外，MyNFT合约还提供了以下增强功能：

1. **基础元数据URI设置**：通过`setBaseURI`函数设置基础元数据URI
2. **单独元数据URI设置**：通过`setTokenURI`函数为特定NFT设置单独的元数据URI
3. **铸造时设置元数据**：通过`safeMintWithURI`函数在铸造NFT时直接设置元数据URI

```solidity
// 铸造NFT
function safeMint(address to) public onlyOwner

// 铸造NFT并设置元数据URI
function safeMintWithURI(address to, string memory _tokenURI) public onlyOwner

// 设置基础元数据URI
function setBaseURI(string memory baseURI) public onlyOwner

// 为特定NFT设置元数据URI
function setTokenURI(uint256 tokenId, string memory _tokenURI) public onlyOwner
```

### NFTAuction合约

拍卖合约支持使用ETH或ERC20代币进行NFT拍卖：

```solidity
// 创建新的拍卖
function createAuction(address nftContract, uint256 tokenId, uint256 startingBid, uint256 duration, address bidToken) external

// 参与竞价
function placeBid(uint256 auctionId) external payable

// 结束拍卖
function endAuction(uint256 auctionId) external

// 价格转换（代币金额转USD价值）
function convertToUsd(uint256 amount, address token) public view returns (uint256)
```

### AuctionFactory合约

拍卖工厂合约负责创建和管理拍卖合约实例：

```solidity
// 创建新的拍卖合约
function createAuctionContract() external returns (address)

// 设置代币价格预言机
function setTokenPriceFeed(address token, address priceFeed) external onlyOwner

// 检查是否是拍卖合约创建者
function isAuctionCreator(address auctionContract, address creator) public view returns (bool)

// 获取支持的代币列表
function supportedTokens(uint256 index) public view returns (address)
```

## 使用说明

### 1. 铸造NFT

```javascript
// 基本铸造
await myNFT.safeMint(recipientAddress);

// 铸造并设置元数据URI
await myNFT.safeMintWithURI(recipientAddress, "https://example.com/api/nft/1");
```

### 2. 创建拍卖

```javascript
// 通过工厂创建拍卖合约
const auctionContractAddress = await auctionFactory.createAuctionContract();
const nftAuction = await ethers.getContractAt('NFTAuction', auctionContractAddress);

// 创建NFT拍卖（使用ETH出价）
await nftAuction.createAuction(
  myNFT.address,  // NFT合约地址
  tokenId,        // NFT的ID
  startingBid,    // 起拍价（WEI）
  duration,       // 拍卖持续时间（秒）
  ethers.ZeroAddress // 使用ETH出价
);

// 创建NFT拍卖（使用ERC20代币出价）
await nftAuction.createAuction(
  myNFT.address,  // NFT合约地址
  tokenId,        // NFT的ID
  startingBid,    // 起拍价
  duration,       // 拍卖持续时间（秒）
  auctionToken.address // 使用指定ERC20代币出价
);
```

### 3. 参与竞价

```javascript
// 使用ETH出价
await nftAuction.placeBid(auctionId, {
  value: bidAmount
});

// 使用ERC20代币出价（需要先授权）
await auctionToken.approve(nftAuction.address, bidAmount);
await nftAuction.placeBid(auctionId);
```

### 4. 结束拍卖

```javascript
// 结束拍卖，NFT将转移给出价最高者，资金转移给卖家
await nftAuction.endAuction(auctionId);
```

## 安全考虑

1. 本合约使用了`ReentrancyGuard`来防止重入攻击
2. 在转移资金和NFT时进行了适当的权限检查
3. AuctionFactory合约已修复价格预言机设置逻辑，确保正确地将代币价格信息传递给新创建的拍卖合约
4. 确保在生产环境中使用前进行全面的安全审计

## 注意事项

1. 本项目仅用于学习和演示目的，在生产环境中使用前需要进行全面的安全审计
2. 在实际部署时，需要配置正确的Chainlink价格预言机地址
3. 确保在使用前理解合约的功能和风险
4. 私钥和敏感配置信息应存储在.env文件中，不要提交到版本控制系统

## 许可证

本项目采用MIT许可证。
