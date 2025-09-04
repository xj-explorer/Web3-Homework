// scripts/mint-test-token.js

// 这个脚本用于向指定地址铸造更多的TestToken代币

const hre = require("hardhat");

async function main() {
  // 解析命令行参数
  const args = process.argv.slice(2);
  
  // 查找命令行参数中的token地址、接收者地址和金额
  let tokenAddress = "";
  let recipientAddress = "";
  let amount = "";
  
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--token" && i + 1 < args.length) {
      tokenAddress = args[i + 1];
    } else if (args[i] === "--recipient" && i + 1 < args.length) {
      recipientAddress = args[i + 1];
    } else if (args[i] === "--amount" && i + 1 < args.length) {
      amount = args[i + 1];
    }
  }
  
  // 验证参数
  if (!tokenAddress || !recipientAddress || !amount) {
    console.error("缺少必要的参数！");
    console.error("使用方法: npx hardhat run scripts/mint-test-token.js --network <network> --token <token_address> --recipient <recipient_address> --amount <amount>");
    process.exit(1);
  }
  
  // 检查地址格式是否正确
  if (!hre.ethers.isAddress(tokenAddress) || !hre.ethers.isAddress(recipientAddress)) {
    console.error("无效的以太坊地址！");
    process.exit(1);
  }
  
  // 获取部署者账户（应该是TestToken合约的所有者）
  const [deployer] = await hre.ethers.getSigners();
  
  console.log("正在使用以下账户铸造代币：", deployer.address);
  console.log(`目标网络: ${hre.network.name}`);
  console.log(`代币地址: ${tokenAddress}`);
  console.log(`接收者地址: ${recipientAddress}`);
  console.log(`铸造金额: ${amount}`);
  
  // 获取TestToken合约实例
  const testToken = await hre.ethers.getContractAt("TestToken", tokenAddress);
  
  // 检查部署者是否为合约所有者
  const owner = await testToken.owner();
  if (owner.toLowerCase() !== deployer.address.toLowerCase()) {
    console.error("错误：您不是TestToken合约的所有者，无法铸造代币！");
    console.error(`合约所有者地址: ${owner}`);
    process.exit(1);
  }
  
  // 转换金额为wei单位
  const amountInWei = hre.ethers.parseEther(amount);
  
  // 执行铸造操作
  console.log(`\n正在铸造 ${amount} 个代币...`);
  const tx = await testToken.mint(recipientAddress, amountInWei);
  
  // 等待交易确认
  console.log("等待交易确认...");
  const receipt = await tx.wait();
  
  // 输出交易信息
  console.log(`\n代币铸造成功！`);
  console.log(`交易哈希: ${receipt.hash}`);
  console.log(`铸造数量: ${amount} TTK`);
  console.log(`铸造给地址: ${recipientAddress}`);
  
  // 获取接收者的新余额
  const newBalance = await testToken.balanceOf(recipientAddress);
  console.log(`接收者当前余额: ${hre.ethers.formatEther(newBalance)} TTK`);
}

// 执行铸造脚本
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });