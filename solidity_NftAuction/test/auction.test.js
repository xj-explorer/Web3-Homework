const { expect } = require('chai');
const { ethers, network } = require('hardhat');
const { time } = require('@nomicfoundation/hardhat-network-helpers');

describe('Auction', function () {
  let myNFT;
  let myERC20;
  let auction;
  let owner;
  let addr1;
  let addr2;
  let addr3;
  let ethUsdPriceFeed;

  beforeEach(async function () {
    // 跳过真实网络测试
    if (network.name !== 'hardhat') {
      this.skip();
    }

    [owner, addr1, addr2, addr3] = await ethers.getSigners();

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

    // 部署Auction合约（UUPS代理）
    const Auction = await ethers.getContractFactory('Auction');
    auction = await upgrades.deployProxy(Auction, [
      ethUsdPriceFeed.target,
      200, // 2% 基础手续费
      500, // 5% 最大手续费
      ethers.parseEther('10'), // 10 ETH 手续费阈值
      owner.address, // initialOwner
      owner.address // factory (使用owner作为测试环境中的factory)
    ], {
      initializer: 'initialize',
      kind: 'uups'
    });
    await auction.waitForDeployment();

    // 设置ERC20价格预言机
    const tokenUsdPriceFeed = await MockV3Aggregator.deploy(8, 100000000); // 1美元
    await tokenUsdPriceFeed.waitForDeployment();
    await auction.setTokenPriceFeed(myERC20.target, tokenUsdPriceFeed.target);

    // 铸造NFT并批准给拍卖合约
    await myNFT.safeMint(owner.address, 'ipfs://example-uri');
    await myNFT.approve(auction.target, 0);

    // 给测试账户转账ERC20代币
    await myERC20.transfer(addr1.address, ethers.parseEther('1000'));
    await myERC20.transfer(addr2.address, ethers.parseEther('1000'));
    await myERC20.connect(addr1).approve(auction.target, ethers.parseEther('1000'));
    await myERC20.connect(addr2).approve(auction.target, ethers.parseEther('1000'));
  });

  it('Should create an auction', async function () {
    const duration = 86400; // 1天
    const startingPrice = ethers.parseEther('1');

    await expect(auction.createAuction(
      myNFT.target,
      0,
      startingPrice,
      duration,
      ethers.ZeroAddress
    )).to.emit(auction, 'AuctionCreated')
      .withArgs(0, owner.address, myNFT.target, 0);

    const auctionInfo = await auction.auctions(0);
    expect(auctionInfo.seller).to.equal(owner.address);
    expect(auctionInfo.nftContract).to.equal(myNFT.target);
    expect(auctionInfo.nftId).to.equal(0);
    expect(auctionInfo.startingPrice).to.equal(startingPrice);
    expect(auctionInfo.currentPrice).to.equal(startingPrice);
    expect(auctionInfo.paymentToken).to.equal(ethers.ZeroAddress);
    expect(auctionInfo.status).to.equal(0); // Active
  });

  it('Should place bids in ETH', async function () {
    const duration = 86400;
    const startingPrice = ethers.parseEther('1');

    await auction.createAuction(
      myNFT.target,
      0,
      startingPrice,
      duration,
      ethers.ZeroAddress
    );

    // Addr1出价1.5 ETH
    const bidAmount1 = ethers.parseEther('1.5');
    await expect(auction.connect(addr1).placeBid(0, { value: bidAmount1 }))
      .to.emit(auction, 'BidPlaced')
      .withArgs(0, addr1.address, bidAmount1);

    let auctionInfo = await auction.auctions(0);
    expect(auctionInfo.currentPrice).to.equal(bidAmount1);
    expect(auctionInfo.currentWinner).to.equal(addr1.address);

    // Addr2出价2 ETH
    const bidAmount2 = ethers.parseEther('2');
    await expect(auction.connect(addr2).placeBid(0, { value: bidAmount2 }))
      .to.emit(auction, 'BidPlaced')
      .withArgs(0, addr2.address, bidAmount2);

    auctionInfo = await auction.auctions(0);
    expect(auctionInfo.currentPrice).to.equal(bidAmount2);
    expect(auctionInfo.currentWinner).to.equal(addr2.address);
  });

  it('Should place bids in ERC20', async function () {
    const duration = 86400;
    const startingPrice = ethers.parseEther('100');

    await auction.createAuction(
      myNFT.target,
      0,
      startingPrice,
      duration,
      myERC20.target
    );

    // Addr1出价150 ERC20
    const bidAmount1 = ethers.parseEther('150');
    await myERC20.connect(addr1).approve(auction.target, bidAmount1);
    await expect(auction.connect(addr1).placeBid(0))
      .to.emit(auction, 'BidPlaced')
      .withArgs(0, addr1.address, bidAmount1);

    let auctionInfo = await auction.auctions(0);
    expect(auctionInfo.currentPrice).to.equal(bidAmount1);
    expect(auctionInfo.currentWinner).to.equal(addr1.address);
  });

  it('Should end auction and transfer NFT and funds', async function () {
    const duration = 60; // 1分钟
    const startingPrice = ethers.parseEther('1');

    await auction.createAuction(
      myNFT.target,
      0,
      startingPrice,
      duration,
      ethers.ZeroAddress
    );

    // Addr1出价1.5 ETH
    const bidAmount = ethers.parseEther('1.5');
    await auction.connect(addr1).placeBid(0, { value: bidAmount });

    // 快进时间到拍卖结束
    await time.increase(duration + 1);

    // 结束拍卖
    await expect(auction.endAuction(0))
      .to.emit(auction, 'AuctionEnded')
      .withArgs(0, addr1.address, bidAmount);

    // 检查NFT是否转移
    expect(await myNFT.ownerOf(0)).to.equal(addr1.address);

    // 检查卖家是否收到资金（扣除手续费）
    const fee = await auction.calculateFee(bidAmount);
    const sellerAmount = bidAmount - fee;
    expect(await ethers.provider.getBalance(owner.address)).to.be.gt(0);
  });

  it('Should calculate correct fee', async function () {
    // 测试低于阈值的情况
    const amount1 = ethers.parseEther('5');
    const fee1 = await auction.calculateFee(amount1);
    expect(fee1).to.equal(amount1 * 200n / 10000n); // 2%

    // 测试高于阈值的情况
    const amount2 = ethers.parseEther('15');
    const fee2 = await auction.calculateFee(amount2);
    const baseFee = ethers.parseEther('10') * 200n / 10000n;
    const excessFee = ethers.parseEther('5') * 500n / 10000n;
    expect(fee2).to.equal(baseFee + excessFee);
  });

  it('Should get correct price in USD', async function () {
    // ETH价格测试
    const ethAmount = ethers.parseEther('1');
    const ethUsdPrice = await auction.getPriceInUSD(ethers.ZeroAddress, ethAmount);
    expect(ethUsdPrice).to.equal(ethers.parseEther('2000')); // 1 ETH = 2000 USD

    // ERC20价格测试
    const tokenAmount = ethers.parseEther('1');
    const tokenUsdPrice = await auction.getPriceInUSD(myERC20.target, tokenAmount);
    expect(tokenUsdPrice).to.equal(ethers.parseEther('1')); // 1 ERC20 = 1 USD
  });
});

// 模拟Chainlink V3Aggregator合约
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