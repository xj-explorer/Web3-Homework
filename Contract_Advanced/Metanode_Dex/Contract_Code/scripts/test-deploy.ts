// @ts-nocheck - 忽略整个文件的TypeScript错误
// 用于在Sepolia测试网上快速部署和测试合约
import hre from "hardhat";

async function testDeploy() {
  try {
    // 确保使用Sepolia网络
    console.log(`当前网络: ${hre.network.name}`);
    if (hre.network.name !== 'sepolia') {
      console.log('警告: 请确保使用 --network sepolia 参数运行此脚本');
    }

    // 获取部署者账户和公共客户端
    const [deployer] = await hre.viem.getWalletClients();
    const publicClient = await hre.viem.getPublicClient();
    
    // 检查账户余额
    const balance = await publicClient.getBalance({ address: deployer.account.address });
    console.log(`部署者地址: ${deployer.account.address}`);
    console.log(`账户余额: ${balance.toString()} wei (${balance / 10n ** 18n} ETH)`);

    // 部署PoolManager
    console.log("\n开始部署PoolManager合约...");
    const PoolManager = await hre.viem.deployContract("PoolManager");
    console.log(`PoolManager部署地址: ${PoolManager.address}`);
    console.log(`PoolManager部署交易哈希: ${PoolManager.deploymentTransaction?.hash}`);

    // 部署SwapRouter
    console.log("\n开始部署SwapRouter合约...");
    const SwapRouter = await hre.viem.deployContract("SwapRouter", [
      PoolManager.address,
    ]);
    console.log(`SwapRouter部署地址: ${SwapRouter.address}`);
    console.log(`SwapRouter部署交易哈希: ${SwapRouter.deploymentTransaction?.hash}`);

    // 部署PositionManager
    console.log("\n开始部署PositionManager合约...");
    const PositionManager = await hre.viem.deployContract("PositionManager", [
      PoolManager.address,
    ]);
    console.log(`PositionManager部署地址: ${PositionManager.address}`);
    console.log(`PositionManager部署交易哈希: ${PositionManager.deploymentTransaction?.hash}`);

    // 测试合约基本功能
    console.log("\n开始测试合约基本功能...");
    
    // 检查PoolManager的基本功能
    try {
      const pairs = await PoolManager.read.getPairs();
      console.log(`PoolManager中的交易对数量: ${pairs.length}`);
      console.log("PoolManager功能测试: 成功读取交易对列表");
    } catch (error) {
      console.error("PoolManager功能测试失败:", error);
    }

    console.log("\n测试部署完成！所有合约已成功部署到Sepolia测试网。");
    console.log("您可以使用这些地址进行进一步的测试和开发。");
    console.log("提示: 可以使用etherscan.io查询这些合约的详细信息和交易记录。");

  } catch (error) {
    console.error("测试部署过程中出现错误:", error);
    process.exit(1);
  }
}

// 运行部署函数
console.log("===== Sepolia测试网合约部署脚本开始 ======");
testDeploy().then(() => {
  console.log("===== Sepolia测试网合约部署脚本结束 ======");
  process.exit(0);
});