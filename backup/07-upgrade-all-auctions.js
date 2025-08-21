const { ethers } = require('hardhat');

module.exports = async ({ getNamedAccounts, deployments }) => {
  const { deployer } = await getNamedAccounts();

  // 获取已部署的AuctionFactory和AuctionV2合约
  const factoryDeployment = await deployments.get('AuctionFactory');
  const auctionV2Deployment = await deployments.get('AuctionV2');

  const factory = await ethers.getContractAt('AuctionFactory', factoryDeployment.address);
  const auctionV2Impl = auctionV2Deployment.address;

  console.log('AuctionFactory at:', factoryDeployment.address);
  console.log('New Auction implementation (V2):', auctionV2Impl);

  // 先更新工厂合约中的拍卖实现地址
  console.log('Updating auction implementation in factory...');
  await factory.updateAuctionImplementation(auctionV2Impl);
  console.log('Auction implementation updated in factory');

  // 获取当前拍卖数量
  const nextAuctionId = await factory.nextAuctionId();
  const auctionCount = nextAuctionId.toNumber();
  console.log(`Found ${auctionCount} auctions to upgrade`);

  // 批量升级所有拍卖合约
  if (auctionCount > 0) {
    // 分批处理，每批最多50个
    const batchSize = 50;
    for (let i = 0; i < auctionCount; i += batchSize) {
      const end = Math.min(i + batchSize, auctionCount);
      const auctionIds = Array.from({ length: end - i }, (_, j) => j + i);

      console.log(`Upgrading auctions ${i} to ${end - 1}...`);
      await factory.upgradeAuctions(auctionIds);
      console.log(`Auctions ${i} to ${end - 1} upgraded successfully`);
    }
  }

  console.log('All auctions upgraded successfully to V2');
};

module.exports.tags = ['Auction', 'Upgrade', 'V2', 'Batch'];
module.exports.dependencies = ['AuctionFactory', 'AuctionV2'];