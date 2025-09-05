const { ethers, upgrades } = require('hardhat');
const { expect } = require('chai');

describe('Auction Upgrade Test', function () {
  let Auction, auctionProxy, deployer;

  beforeEach(async function () {
    [deployer] = await ethers.getSigners();

    // 部署初始版本的Auction合约（UUPS代理）
    Auction = await ethers.getContractFactory('Auction', deployer);
    auctionProxy = await upgrades.deployProxy(Auction, [
      '0x694AA1769357215DE4FAC081bf1f309aDC325306', // 测试用ETH/USD价格预言机
      250, // 2.5%
      500, // 5%
      1000000, // 1,000,000 USD
      deployer.address, // initialOwner
      deployer.address  // _factory (使用deployer地址作为测试工厂地址)
    ], {
      initializer: 'initialize',
      kind: 'uups'
    });
    await auctionProxy.waitForDeployment();
  });

  it('Should deploy and initialize the proxy contract correctly', async function () {
    const baseFeePercentage = await auctionProxy.baseFeePercentage();
    expect(baseFeePercentage).to.equal(250);

    const nextAuctionId = await auctionProxy.nextAuctionId();
    expect(nextAuctionId).to.equal(0);
  });

  it('Should upgrade the contract to a new version', async function () {
    // 保存升级前的实现地址
    const implementationAddressV1 = await upgrades.erc1967.getImplementationAddress(await auctionProxy.getAddress());

    // 创建一个新版本的Auction合约（添加一个新函数）
    const AuctionV2 = await ethers.getContractFactory('AuctionV2');

    // 升级代理合约
    const upgradedProxy = await upgrades.upgradeProxy(await auctionProxy.getAddress(), AuctionV2);
    await upgradedProxy.waitForDeployment();

    // 调用V2的初始化函数
    await upgradedProxy.initializeV2();

    // 验证升级是否成功
    const implementationAddressV2 = await upgrades.erc1967.getImplementationAddress(await upgradedProxy.getAddress());
    expect(implementationAddressV1).to.not.equal(implementationAddressV2);

    // 验证新函数是否可用
    const version = await upgradedProxy.version();
    expect(version).to.equal('V2');

    // 验证新功能是否正常工作
    const minBidIncrementPercentage = await upgradedProxy.minBidIncrementPercentage();
    expect(minBidIncrementPercentage).to.equal(50);
  });
});

// 注意：AuctionV2合约已在contracts/AuctionV2.sol中定义
// 测试中直接使用ethers.getContractFactory('AuctionV2')加载