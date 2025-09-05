const { ethers, upgrades } = require('hardhat');

module.exports = async ({ getNamedAccounts, deployments }) => {
  console.log('开始执行05-deploy-factory-upgradeable.js脚本');
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  // 获取已部署的AuctionV1代理合约
  const auctionDeployment = await deployments.get('AuctionV1');
  const auctionProxyAddress = auctionDeployment.address;
  console.log('AuctionV1 proxy address:', auctionProxyAddress);

  // 获取AuctionV1的实现地址
  const auctionImplementationAddress = await upgrades.erc1967.getImplementationAddress(auctionProxyAddress);
  console.log('Using AuctionV1 implementation at:', auctionImplementationAddress);

  // 使用OpenZeppelin Upgrades库部署UUPS代理的工厂合约
  console.log('Deploying upgradable AuctionFactory...');
  // 获取部署者签名者
  const [deployerSigner] = await ethers.getSigners();
  const AuctionFactory = await ethers.getContractFactory('AuctionFactory', { signer: deployerSigner });

  // 部署代理合约，传入初始化参数
  const factoryProxy = await upgrades.deployProxy(AuctionFactory, [
    auctionImplementationAddress
  ], {
    initializer: 'initialize',
    kind: 'uups',
    from: deployer,
    log: true,
    autoMine: true,
  });

  await factoryProxy.waitForDeployment();
  console.log('AuctionFactory proxy deployed at:', await factoryProxy.getAddress());

  // 验证实现地址
  const factoryImplementationAddress = await upgrades.erc1967.getImplementationAddress(await factoryProxy.getAddress());
  console.log('AuctionFactory implementation at:', factoryImplementationAddress);
};

module.exports.tags = ['AuctionFactory', 'Upgradeable', 'V2'];
// 暂时移除依赖以避免循环依赖问题
// module.exports.dependencies = ['AuctionV1'];