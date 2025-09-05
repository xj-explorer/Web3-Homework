const { expect } = require('chai');
const { ethers, network, upgrades } = require('hardhat');

describe('AuctionFactory', function () {
  let myNFT;
  let myERC20;
  let auctionImpl;
  let auctionFactory;
  let owner;
  let addr1;
  let ethUsdPriceFeed;

  beforeEach(async function () {
    // 跳过真实网络测试
    if (network.name !== 'hardhat') {
      this.skip();
    }
    

    [owner, addr1] = await ethers.getSigners();
    console.log('Owner address:', owner.address);

    // 部署NFT合约
    const MyNFT = await ethers.getContractFactory('MyNFT');
    myNFT = await MyNFT.deploy();
    await myNFT.waitForDeployment();

    // 部署ERC20合约
    const MyERC20 = await ethers.getContractFactory('MyERC20');
    myERC20 = await MyERC20.deploy();
    await myERC20.waitForDeployment();

    // 部署模拟的价格预言机
    const MockV3Aggregator = await ethers.getContractFactory('MockV3Aggregator');
    ethUsdPriceFeed = await MockV3Aggregator.deploy(8, 200000000000); // 8位小数，2000美元
    await ethUsdPriceFeed.waitForDeployment();

    // 部署Auction实现合约（用于工厂创建实例）
    const Auction = await ethers.getContractFactory('Auction');
    auctionImpl = await Auction.deploy();
    await auctionImpl.waitForDeployment();
    // 记录实现合约地址
    const implAddress = await auctionImpl.getAddress();
    console.log('Auction implementation address:', implAddress);
    // 注意：实现合约未初始化，不能直接调用其函数
    console.log('Auction implementation address:', implAddress);

    // 部署AuctionFactory合约（使用代理）
    const AuctionFactory = await ethers.getContractFactory('AuctionFactory');
    const auctionImplAddress = await auctionImpl.getAddress();

    // 使用upgrades.deployProxy部署可升级合约
    auctionFactory = await upgrades.deployProxy(AuctionFactory, [auctionImplAddress], {
      initializer: 'initialize',
      kind: 'uups'
    });
    await auctionFactory.waitForDeployment();
    console.log('AuctionFactory address:', await auctionFactory.getAddress());
    console.log('AuctionFactory implementation:', await auctionFactory.auctionImplementation());
  });

  it('Should create a new auction contract instance', async function () {
    // 记录创建前的拍卖ID
    const initialAuctionId = await auctionFactory.nextAuctionId();
    console.log('Initial auction ID:', initialAuctionId.toString());

    // 创建拍卖合约
    console.log('Creating auction contract...');
    const tx = await auctionFactory.createAuctionContract(
      ethUsdPriceFeed.target,
      200, // 2% 基础手续费
      500, // 5% 最大手续费
      ethers.parseEther('10') // 10 ETH 手续费阈值
    );

    // 等待交易确认
    await tx.wait();
    console.log('Auction contract created');

    // 验证拍卖ID递增
    const newAuctionId = await auctionFactory.nextAuctionId();
    console.log('New auction ID:', newAuctionId.toString());
    expect(newAuctionId).to.equal(initialAuctionId + 1n);

    // 获取拍卖地址
    const auctionAddress = await auctionFactory.getAuctionAddress(initialAuctionId);
    console.log('Created auction address:', auctionAddress);
    expect(auctionAddress).to.not.equal(ethers.ZeroAddress);

    // 使用工厂合约的verifyAuctionInitialization函数验证拍卖合约的初始化状态
    console.log('Verifying auction initialization via factory...');
    const isInitialized = await auctionFactory.verifyAuctionInitialization(initialAuctionId, 200);
    console.log('Auction initialization verified:', isInitialized);
    expect(isInitialized).to.be.true;

    // 如果验证通过，我们可以尝试直接访问拍卖合约的其他参数
    if (isInitialized) {
      console.log('Attempting to access other auction parameters...');
      const auction2 = await ethers.getContractAt('Auction', auctionAddress);
      
      const maxFeePercentage = await auction2.maxFeePercentage();
      console.log('Max fee percentage:', maxFeePercentage.toString());
      expect(maxFeePercentage).to.equal(500);

      const feeThreshold = await auction2.feeThreshold();
      console.log('Fee threshold:', feeThreshold.toString());
      expect(feeThreshold).to.equal(ethers.parseEther('10'));
    }

  

  // 验证其他参数
  // 注意：我们不再需要这里的验证，因为我们已经在前面通过auction2验证了这些参数
  // 这里只是为了保持测试结构的完整性
  console.log('Auction contract creation test completed successfully.');
});

  it('Should not allow non-owners to create auction contracts', async function () {
    await expect(
      auctionFactory.connect(addr1).createAuctionContract(
        ethUsdPriceFeed.target,
        200,
        500,
        ethers.parseEther('10')
      )
    ).to.be.revertedWithCustomError(auctionFactory, 'OwnableUnauthorizedAccount');
  });

  it('Should get correct auction address by ID', async function () {
    await auctionFactory.createAuctionContract(
      ethUsdPriceFeed.target,
      200,
      500,
      ethers.parseEther('10')
    );

    const auctionAddress = await auctionFactory.getAuctionAddress(0);
    expect(auctionAddress).to.not.equal(ethers.ZeroAddress);

    // 创建第二个拍卖合约
    await auctionFactory.createAuctionContract(
      ethUsdPriceFeed.target,
      300,
      600,
      ethers.parseEther('20')
    );

    const auctionAddress2 = await auctionFactory.getAuctionAddress(1);
    expect(auctionAddress2).to.not.equal(ethers.ZeroAddress);
    expect(auctionAddress2).to.not.equal(auctionAddress);
  });
});

// 重用MockV3Aggregator定义
const MockV3Aggregator = {
  name: 'MockV3Aggregator',
  bytecode: '0x608060405234801561001057600080fd5b50610150806100206000396000f3fe608060405234801561001057600080fd5b50600436106100365760003560e01c8063f68b8f781461003b578063f925d29414610057575b600080fd5b610055600480360381019061005091906100c3565b610075565b005b61005f6100ed565b60405161006c91906100f7565b60405180910390f35b6000805461008690610103565b905090565b6000610095826100cf565b9050919050565b600073ffffffffffffffffffffffffffffffffffffffff82169050919050565b6000602082840312156100cd57600080fd5b81516100db848285016100a2565b93506100e784828501610076565b92506100f384828501610045565b9150915091565b6000610101826100cf565b9050919050565b6000610110828403121561012657600080fd5b8151610134848285016100a2565b935061014084828501610076565b925061014c84828501610045565b915091509156fea26469706673582212206b1a6f2f865bd7bb1c503a940d838d8184e0a877d0855f44e6af17d8b9c3513c64736f6c63430008120033',
  abi: [
    {
      inputs: [
        { internalType: 'uint8', name: '_decimals', type: 'uint8' },
        { internalType: 'int256', name: '_initialAnswer', type: 'int256' },
      ],
      stateMutability: 'nonpayable',
      type: 'constructor',
    },
    {
      inputs: [],
      name: 'latestAnswer',
      outputs: [{ internalType: 'int256', name: '', type: 'int256' }],
      stateMutability: 'view',
      type: 'function',
    },
    {
      inputs: [],
      name: 'latestRoundData',
      outputs: [
        { internalType: 'uint80', name: 'roundId', type: 'uint80' },
        { internalType: 'int256', name: 'answer', type: 'int256' },
        { internalType: 'uint256', name: 'startedAt', type: 'uint256' },
        { internalType: 'uint256', name: 'updatedAt', type: 'uint256' },
        { internalType: 'uint80', name: 'answeredInRound', type: 'uint80' },
      ],
      stateMutability: 'view',
      type: 'function',
    },
  ],
};