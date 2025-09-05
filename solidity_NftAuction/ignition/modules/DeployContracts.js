// 部署所有合约的脚本
const { buildModule } = require('@nomicfoundation/hardhat-ignition/modules');

module.exports = buildModule('DeployContracts', (m) => {
  // 注意：在实际部署时，需要提供真实的Chainlink价格预言机地址
  // 这里使用占位符地址，实际部署时需要替换为正确的地址
  const ethUsdPriceFeed = '0x694AA1769357215DE4FAC081bf1f309aDC325306'; // 测试网的ETH/USD价格预言机地址
  
  // 部署NFT合约
  const myNFT = m.contract('MyNFT');
  
  // 部署ERC20代币合约，初始供应量为1000000
  const auctionToken = m.contract('AuctionToken', [1000000]);
  
  // 部署拍卖工厂合约
  const auctionFactory = m.contract('AuctionFactory', [ethUsdPriceFeed]);
  
  // 为拍卖工厂设置代币价格预言机（使用占位符地址，实际部署时需要替换）
  const tokenUsdPriceFeed = '0x1a81afB8146aeFfCFc5E50e8479e826E7D55b910'; // 使用测试网 EUR / USD 价格预言机
  m.call(auctionFactory, 'setTokenPriceFeed', [auctionToken, tokenUsdPriceFeed]);
  
  // 通过工厂创建一个拍卖合约实例
  const createAuctionContractTx = m.call(auctionFactory, 'createAuctionContract', [], {
    id: 'CreateAuctionContract'
  });
  
  // 获取创建的拍卖合约地址
  const nftAuction = m.readEventArgument(
    createAuctionContractTx, 
    'AuctionContractCreated', 
    'auctionContract',
    {
      id: 'GetAuctionContractAddress'
    }
  );
  
  return {
    myNFT,
    auctionToken,
    auctionFactory,
    nftAuction
  };
});