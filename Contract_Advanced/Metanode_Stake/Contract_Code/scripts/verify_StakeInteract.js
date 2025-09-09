const { ethers } = require("hardhat");

async function main() {
    // 部署到Sepolia测试网
    // MetaNodeToken deployed to: 0xb4A80fBEB0e706e17CC49b89f0Ec6174FBcf4834
    // MetaNodeStake (proxy) deployed to: 0x0F2bbDaF836b2A6Fb90a5E83A7F5ebC59F2Af92f
    // MetaNodeStake (implementation) deployed to: 0x538B4b4D977b7Eb228B85b1146D632350c009884
    
    // 使用await获取合约实例
    const stakeContract = await ethers.getContractAt('MetaNodeStake', '0x0F2bbDaF836b2A6Fb90a5E83A7F5ebC59F2Af92f')

    // 调用合约中实际存在的函数替代不存在的MetaNode()函数
    // 使用poolLength()函数验证合约交互
    const poolCount = await stakeContract.poolLength();
    console.log('质押池数量:', poolCount.toString());
    
    // 获取当前区块号
    const [signer] = await ethers.getSigners();
    const blockNumber = await ethers.provider.getBlockNumber();
    console.log('当前区块号:', blockNumber);
    
    // 获取部署者在质押池0中的待领取奖励
    const pendingRewards = await stakeContract.pendingMetaNode(0, signer.address);
    console.log('待领取MetaNode奖励:', ethers.formatEther(pendingRewards), 'MetaNode');
    
    // 获取质押合约中的MetaNode代币合约地址
    // 注意：MetaNode是合约中的公共状态变量，可以通过getter函数访问
    const metaNodeTokenAddress = await stakeContract.MetaNode();
    console.log('MetaNode代币合约地址:', metaNodeTokenAddress);

}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });