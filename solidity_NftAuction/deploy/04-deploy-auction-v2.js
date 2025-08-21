const { ethers, upgrades } = require('hardhat');

module.exports = async ({ getNamedAccounts, deployments }) => {
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  // 部署 AuctionV2 实现合约
  console.log('Deploying AuctionV2 implementation contract...');
  // 获取部署者签名者
  const [deployerSigner] = await ethers.getSigners();
  const AuctionV2 = await ethers.getContractFactory('AuctionV2', { signer: deployerSigner });
  const auctionV2Impl = await AuctionV2.deploy();
  await auctionV2Impl.waitForDeployment();
  const auctionV2Address = await auctionV2Impl.getAddress();
  console.log('AuctionV2 implementation deployed to:', auctionV2Address);

  // 记录部署信息
  await deploy('AuctionV2', {
    contract: 'AuctionV2',
    from: deployer,
    args: [],
    log: true,
    autoMine: true,
  });
};

module.exports.tags = ['AuctionV2', 'Upgradeable', 'V2'];
module.exports.dependencies = ['AuctionV1']; // 依赖于已部署的 AuctionV1 合约