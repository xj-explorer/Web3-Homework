// scripts/deploy-test-token.js

// 这个脚本用于部署TestToken合约到指定的网络

const hre = require("hardhat");

async function main() {
  // 获取部署者账户
  const [deployer] = await hre.ethers.getSigners();
  
  console.log("正在使用以下账户部署TestToken合约：", deployer.address);
  
  // 获取TestToken合约工厂
  const TestToken = await hre.ethers.getContractFactory("TestToken");
  
  // 部署TestToken合约，设置代币名称、符号和初始供应量
  // 初始供应量设为10,000,000，单位是wei（这里的decimals是18）
  const tokenName = "Test Token";
  const tokenSymbol = "TTK";
  const initialSupply = hre.ethers.parseEther("10000000"); // 10,000,000 TTK
  
  console.log(`正在部署TestToken合约：名称="${tokenName}", 符号="${tokenSymbol}", 初始供应量="${hre.ethers.formatEther(initialSupply)}"`);
  
  const testToken = await TestToken.deploy(tokenName, tokenSymbol, initialSupply);
  
  // 等待合约部署完成
  await testToken.waitForDeployment();
  
  const tokenAddress = await testToken.getAddress();
  
  console.log(`\nTestToken合约部署成功！`);
  console.log(`合约地址: ${tokenAddress}`);
  console.log(`网络: ${hre.network.name}`);
  console.log(`部署者地址: ${deployer.address}`);
  console.log(`初始供应量: ${hre.ethers.formatEther(initialSupply)} ${tokenSymbol}`);
  
  // 输出铸造更多代币的命令示例
  console.log(`\n铸造更多代币的命令示例：`);
  console.log(`npx hardhat run scripts/mint-test-token.js --network ${hre.network.name} --token ${tokenAddress} --recipient <your_address> --amount <amount>`);
  
  // 输出合约验证命令（如果适用）
  if (hre.network.name !== "hardhat" && hre.network.name !== "localhost") {
    console.log(`\n等待区块确认，准备验证合约...`);
    await testToken.deploymentTransaction().wait(5);
    
    try {
      await hre.run("verify:verify", {
        address: tokenAddress,
        constructorArguments: [
          tokenName,
          tokenSymbol,
          initialSupply
        ],
      });
      console.log("合约验证成功！");
    } catch (error) {
      console.log("合约验证失败：", error.message);
      console.log("您可以手动验证合约：");
      console.log(`npx hardhat verify --network ${hre.network.name} ${tokenAddress} "${tokenName}" "${tokenSymbol}" ${initialSupply}`);
    }
  }
}

// 执行部署脚本
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });