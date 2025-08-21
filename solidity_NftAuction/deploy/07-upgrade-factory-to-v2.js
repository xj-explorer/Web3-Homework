const { ethers, upgrades } = require('hardhat');

module.exports = async ({ getNamedAccounts, deployments }) => {
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  // 获取已部署的AuctionFactory代理合约地址
  const factoryDeployment = await deployments.get('AuctionFactory');
  const proxyAddress = factoryDeployment.address;
  console.log('Upgrading AuctionFactory proxy at:', proxyAddress);

  // 加载新版本的工厂合约
  const AuctionFactoryV2 = await ethers.getContractFactory('AuctionFactoryV2', deployer);

  // 升级代理合约
  console.log('Upgrading to AuctionFactoryV2...');
  const upgradedProxy = await upgrades.upgradeProxy(proxyAddress, AuctionFactoryV2);
  await upgradedProxy.waitForDeployment();
  console.log('AuctionFactory proxy upgraded successfully');

  // 验证升级是否成功
  const implementationAddress = await upgrades.erc1967.getImplementationAddress(await upgradedProxy.getAddress());
  console.log('New factory implementation address:', implementationAddress);

  // 调用V2版本的helloworld函数验证升级
  const factoryV2 = await ethers.getContractAt('AuctionFactoryV2', proxyAddress);
  const helloMessage = await factoryV2.helloworld();
  console.log('Verified V2 function:', helloMessage);
  const version = await factoryV2.version();
  console.log('Contract version:', version);
};

module.exports.tags = ['AuctionFactory', 'Upgrade', 'V2'];
module.exports.dependencies = ['AuctionFactory'];