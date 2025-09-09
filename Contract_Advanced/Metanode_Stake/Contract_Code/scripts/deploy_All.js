// scripts/deploy.js
const { ethers, upgrades } = require("hardhat");

async function main() {
  const [signer] = await ethers.getSigners()

    const MetaNodeToken = await ethers.getContractFactory('MetaNodeToken')
    const metaNodeToken = await MetaNodeToken.deploy()

    await metaNodeToken.waitForDeployment();
    const metaNodeTokenAddress = await metaNodeToken.getAddress();
    console.log("MetaNodeToken deployed to:", metaNodeTokenAddress);
    
  // 1. 获取合约工厂
  const MetaNodeStake = await ethers.getContractFactory("MetaNodeStake");

  // 2. 设置初始化参数（根据initialize函数）
  const startBlock = 9168000; 
  const endBlock = 9529999;
  const metaNodePerBlock = ethers.parseUnits("1", 18); // 每区块奖励1个MetaNode（18位精度）

  // 3. 部署可升级代理合约
  const stake = await upgrades.deployProxy(
    MetaNodeStake,
    [metaNodeTokenAddress, startBlock, endBlock, metaNodePerBlock],
    { initializer: "initialize" }
  );

  await stake.waitForDeployment();

  const stakeAddress = await stake.getAddress()
  const tokenAmount = await metaNodeToken.balanceOf(signer.address)
  let tx = await metaNodeToken.connect(signer).transfer(stakeAddress, tokenAmount)
  await tx.wait()

  // 代理合约地址
  console.log("MetaNodeStake (proxy) deployed to:", stakeAddress);
  // 实现合约地址
  const implementationAddress = await upgrades.erc1967.getImplementationAddress(stakeAddress);
  console.log("MetaNodeStake (implementation) deployed to:", implementationAddress);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });