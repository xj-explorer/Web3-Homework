// 部署脚本 - 部署PriceConsumer合约到Sepolia测试网
const { ethers } = require('hardhat');
require('dotenv').config();

async function main() {
  // 获取部署者账户
  const [deployer] = await ethers.getSigners();
  console.log('部署合约的账户地址:', deployer.address);

  // 获取账户余额
  const provider = ethers.provider;
  const balance = await provider.getBalance(deployer.address);
  console.log('部署者账户余额:', ethers.formatEther(balance), 'ETH');

  // Chainlink ETH/USD价格Feed地址（Sepolia测试网）
  // 参考来源：https://docs.chain.link/data-feeds/price-feeds/addresses?network=ethereum&page=1
  const ethUsdPriceFeedAddress = process.env.CHAINLINK_ETH_USD_PRICE_FEED || '0x694AA1769357215DE4FAC081bf1f309aDC325306';
  console.log('Chainlink ETH/USD价格Feed地址:', ethUsdPriceFeedAddress);

  // 获取PriceConsumer合约工厂
  const PriceConsumer = await ethers.getContractFactory('PriceConsumer');
  
  // 部署合约，传入价格Feed地址作为构造函数参数
  const priceConsumer = await PriceConsumer.deploy(ethUsdPriceFeedAddress);
  
  // 等待合约部署完成
  await priceConsumer.waitForDeployment();
  
  // 获取合约地址
  const contractAddress = await priceConsumer.getAddress();
  console.log('PriceConsumer合约已部署到地址:', contractAddress);

  // 打印合约信息
  console.log('\n合约信息:');
  console.log('- 部署交易哈希:', priceConsumer.deploymentTransaction().hash);
  console.log('- Etherscan验证命令:');
  console.log(`npx hardhat verify --network sepolia ${contractAddress} ${ethUsdPriceFeedAddress}`);

  // 建议用户的下一步操作
  console.log('\n下一步操作建议:');
  console.log('1. 验证合约: 运行上面的Etherscan验证命令');
  console.log('2. 测试合约: 调用getLatestPrice()获取实时ETH价格');
  console.log('3. 设置价格阈值: 调用setPriceThreshold(threshold)设置您关心的价格阈值');
  console.log('4. 查看价格历史: 通过区块链浏览器查看合约事件和交易记录');
}

// 执行主函数
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });