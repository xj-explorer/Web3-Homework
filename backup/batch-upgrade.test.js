const { expect } = require('chai');
const { ethers, upgrades } = require('hardhat');

describe('Batch Auction Upgrade Test', function () {
  let deployer, user1;
  let auctionFactory;
  let auctionImpl, auctionV2Impl;

  before(async function () {
    [deployer, user1] = await ethers.getSigners();

    // 部署Auction实现合约
    const Auction = await ethers.getContractFactory('Auction', deployer);
    auctionImpl = await Auction.deploy();
    await auctionImpl.waitForDeployment();

    // 部署AuctionV2实现合约
    const AuctionV2 = await ethers.getContractFactory('AuctionV2', deployer);
    auctionV2Impl = await AuctionV2.deploy();
    await auctionV2Impl.waitForDeployment();

    // 部署可升级的AuctionFactory合约
    const AuctionFactory = await ethers.getContractFactory('AuctionFactory', deployer);
    auctionFactory = await upgrades.deployProxy(AuctionFactory, [auctionImpl.target], {
      initializer: 'initialize',
      kind: 'uups',
    });
    await auctionFactory.waitForDeployment();
  });

  it('should create multiple auctions with V1 implementation', async function () {
    const ethUsdPriceFeed = '0x694AA1769357215DE4FAC081bf1f309aDC325306';
    const baseFeePercentage = 250;
    const maxFeePercentage = 500;
    const feeThreshold = 1000000;

    // 创建5个拍卖合约
    for (let i = 0; i < 5; i++) {
      await auctionFactory.createAuctionContract(
        ethUsdPriceFeed,
        baseFeePercentage,
        maxFeePercentage,
        feeThreshold
      );
    }

    // 检查是否创建了5个拍卖
    const nextAuctionId = await auctionFactory.nextAuctionId();
    expect(nextAuctionId).to.equal(5);

    // 验证第一个拍卖是V1版本
    const firstAuctionAddress = await auctionFactory.auctions(0);
    const firstAuction = await ethers.getContractAt('Auction', firstAuctionAddress);
    // 验证第一个拍卖是V1版本（没有version函数）
    try {
      // 尝试调用version函数
      await firstAuction.version();
      expect.fail('V1 auction should not have version function');
    } catch (error) {
      // 对于ethers.js，当合约ABI中没有该函数时，会抛出此错误
      expect(error.message).to.include('version is not a function');
    }
  });

  it('should batch upgrade multiple auctions to V2', async function () {
    // 更新工厂合约中的拍卖实现地址到V2
    await auctionFactory.updateAuctionImplementation(auctionV2Impl.target);

    // 批量升级所有拍卖合约
    const auctionIds = [0, 1, 2, 3, 4];
    await auctionFactory.upgradeAuctions(auctionIds);

    // 验证所有拍卖合约都已升级到V2
    for (let i = 0; i < auctionIds.length; i++) {
      const auctionId = auctionIds[i];
      const auctionAddress = await auctionFactory.auctions(auctionId);
      const auction = await ethers.getContractAt('AuctionV2', auctionAddress);
      const version = await auction.version();
      expect(version).to.equal('V2');

      // 验证V2功能
      const minBidIncrement = await auction.minBidIncrementPercentage();
      expect(minBidIncrement).to.equal(50); // 默认5%
    }
  });

  it('should handle partial upgrade failures gracefully', async function () {
    // 创建一个新的拍卖
    const ethUsdPriceFeed = '0x694AA1769357215DE4FAC081bf1f309aDC325306';
    const baseFeePercentage = 250;
    const maxFeePercentage = 500;
    const feeThreshold = 1000000;

    await auctionFactory.createAuctionContract(
      ethUsdPriceFeed,
      baseFeePercentage,
      maxFeePercentage,
      feeThreshold
    );

    // 尝试升级一个无效的拍卖ID
    const invalidAuctionIds = [100]; // 100是无效的
    try {
      await auctionFactory.upgradeAuctions(invalidAuctionIds);
      expect.fail('Should revert with invalid auction ID');
    } catch (error) {
      // 验证错误消息包含预期内容之一
      expect(error.message).to.satisfy(msg =>
        msg.includes('Auction does not exist') ||
        msg.includes('invalid auction ID') ||
        msg.includes('reverted')
      );
    }

    // 尝试升级混合有效和无效的拍卖ID
    const mixedAuctionIds = [5, 100]; // 5是有效ID，100是无效ID
    try {
      await auctionFactory.upgradeAuctions(mixedAuctionIds);
      expect.fail('Should revert with invalid auction ID');
    } catch (error) {
      // 验证错误消息包含预期内容之一
      expect(error.message).to.satisfy(msg =>
        msg.includes('Auction does not exist') ||
        msg.includes('invalid auction ID') ||
        msg.includes('reverted')
      );
    }

    // 验证有效的拍卖ID是否被升级
    const auctionAddress = await auctionFactory.auctions(5);
    const auction = await ethers.getContractAt('AuctionV2', auctionAddress);
    const version = await auction.version();
    expect(version).to.equal('V2');
  });
});