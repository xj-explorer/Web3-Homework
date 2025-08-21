const { ethers, upgrades } = require('hardhat');

module.exports = async ({ getNamedAccounts, deployments }) => {
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  // 获取已部署的Auction UUPS代理合约地址
  const auctionDeployment = await deployments.get('Auction');
  const proxyAddress = auctionDeployment.address;
  console.log('Upgrading Auction proxy at:', proxyAddress);

  // 加载AuctionV2合约
  const AuctionV2 = await ethers.getContractFactory('AuctionV2', deployer);

  // 升级代理合约
  console.log('Upgrading to AuctionV2...');
  const upgradedProxy = await upgrades.upgradeProxy(proxyAddress, AuctionV2);
  await upgradedProxy.waitForDeployment();
  console.log('Auction proxy upgraded successfully to V2');

  // 调用V2版本的初始化函数
  console.log('Initializing V2 features...');
  await upgradedProxy.initializeV2();
  console.log('AuctionV2 initialized successfully');

  // 验证升级是否成功
  const implementationAddress = await upgrades.erc1967.getImplementationAddress(await upgradedProxy.getAddress());
  console.log('New implementation address:', implementationAddress);

  // 验证新功能
  const version = await upgradedProxy.version();
  console.log('Auction version after upgrade:', version);

  const minBidIncrementPercentage = await upgradedProxy.minBidIncrementPercentage();
  console.log('Minimum bid increment percentage:', minBidIncrementPercentage);
};

module.exports.tags = ['Auction', 'Upgrade', 'V2'];
module.exports.dependencies = ['Auction', 'AuctionV2']; // 依赖于已部署的Auction代理合约和AuctionV2实现合约