const { ethers } = require("hardhat");

async function main() {
  // 用于本地测试: 本地跑了 npx hardhat node, 
  // 接着运行了另一个终端跑了: npx hardhat run scripts/deploy.js --network localhost, 生成了部署在本地的合约0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512
  // const MetaNodeStake = await ethers.getContractAt("MetaNodeStake", "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512");

  // 部署到Sepolia测试网
  // MetaNodeToken deployed to: 0xb4A80fBEB0e706e17CC49b89f0Ec6174FBcf4834
  // MetaNodeStake (proxy) deployed to: 0x0F2bbDaF836b2A6Fb90a5E83A7F5ebC59F2Af92f
  // MetaNodeStake (implementation) deployed to: 0x538B4b4D977b7Eb228B85b1146D632350c009884
  
  const MetaNodeStake = await ethers.getContractAt("MetaNodeStake", "0x0F2bbDaF836b2A6Fb90a5E83A7F5ebC59F2Af92f");  
  const pool = await MetaNodeStake.addPool(ethers.ZeroAddress, 500, 100, 20, true);
  console.log(pool);
}

main();