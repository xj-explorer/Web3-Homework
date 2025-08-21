const { ethers, upgrades } = require('hardhat');

module.exports = async ({ getNamedAccounts, deployments }) => {
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  // 使用OpenZeppelin Upgrades库部署UUPS代理
  const Auction = await ethers.getContractFactory('Auction');
  console.log('Deploying Auction UUPS proxy...');

  // 部署代理合约，传入初始化参数
  // 注意：需要替换为实际的价格预言机地址
  const ethUsdPriceFeed = '0x694AA1769357215DE4FAC081bf1f309aDC325306'; // Sepolia测试网ETH/USD价格预言机
  const baseFeePercentage = 250; // 2.5%
  const maxFeePercentage = 500; // 5%
  const feeThreshold = 1000000; // 1,000,000 USD

  // 获取deployer地址作为initialOwner
const initialOwner = deployer;
// 设置factory地址（可以是deployer地址或其他指定地址）
const factoryAddress = deployer;

const auctionProxy = await upgrades.deployProxy(Auction, [
    ethUsdPriceFeed,
    baseFeePercentage,
    maxFeePercentage,
    feeThreshold,
    initialOwner,
    factoryAddress
  ], {
    initializer: 'initialize',
    kind: 'uups',
    from: deployer,
    log: true,
    autoMine: true,
  });

  await auctionProxy.waitForDeployment();
  const proxyAddress = await auctionProxy.getAddress();
  console.log('Auction UUPS proxy deployed to:', proxyAddress);

  // 部署实现合约（通常由upgrades库自动处理）
  const implementationAddress = await upgrades.erc1967.getImplementationAddress(proxyAddress);
  console.log('Auction implementation contract deployed to:', implementationAddress);
};

module.exports.tags = ['AuctionV1', 'Upgradeable'];
module.exports.dependencies = [];