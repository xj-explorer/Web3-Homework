// 部署MetaNodeSwap Dex核心合约
// @ts-nocheck - 忽略整个文件的TypeScript错误
// 包括PoolManager、SwapRouter和PositionManager
import hre from "hardhat";
import * as dotenv from "dotenv";

// 加载.env文件中的环境变量
dotenv.config();

async function main() {
  // 验证环境变量
  if (!process.env.SEPOLIA_URL) {
    console.error("错误: 未设置SEPOLIA_URL环境变量，请在.env文件中配置。");
    process.exit(1);
  }
  
  if (!process.env.PRIVATE_KEY) {
    console.error("错误: 未设置PRIVATE_KEY环境变量，请在.env文件中配置。");
    process.exit(1);
  }
  console.log("开始部署MetaNodeSwap Dex核心合约...");
  console.log("----------------------------------------");

  // 验证网络配置
  if (hre.network.name !== "sepolia") {
    console.warn(`警告: 当前网络不是Sepolia，而是${hre.network.name}。如果您想部署到Sepolia，请使用 --network sepolia 参数。`);
  }

  console.log("\n部署配置信息:");
  console.log(`网络: ${hre.network.name}`);
  console.log(`节点URL: ${process.env.SEPOLIA_URL}`);
  console.log(`部署账户: ${process.env.PRIVATE_KEY.substring(0, 6)}...${process.env.PRIVATE_KEY.substring(process.env.PRIVATE_KEY.length - 6)}`);
  
  // 1. 部署PoolManager合约
  console.log("\n正在部署PoolManager合约...");
  // 使用自定义配置部署合约
  const PoolManager = await hre.viem.deployContract("PoolManager", [], {
    // 可以在这里添加额外的部署参数
  });
  console.log(`PoolManager合约部署成功！地址: ${PoolManager.address}`);

  // 2. 部署SwapRouter合约，传入PoolManager地址
  console.log("正在部署SwapRouter合约...");
  const SwapRouter = await hre.viem.deployContract("SwapRouter", [
    PoolManager.address,
  ]);
  console.log(`SwapRouter合约部署成功！地址: ${SwapRouter.address}`);

  // 3. 部署PositionManager合约，传入PoolManager地址
  console.log("正在部署PositionManager合约...");
  const PositionManager = await hre.viem.deployContract("PositionManager", [
    PoolManager.address,
  ]);
  console.log(`PositionManager合约部署成功！地址: ${PositionManager.address}`);

  console.log("----------------------------------------");
  console.log("MetaNodeSwap Dex核心合约部署完成！");

  // 输出合约地址信息，方便用户记录
  console.log(`\n部署信息总结:`);
  console.log(`PoolManager: ${PoolManager.address}`);
  console.log(`SwapRouter: ${SwapRouter.address}`);
  console.log(`PositionManager: ${PositionManager.address}`);

  // 如果是在Sepolia测试网络上部署，提示用户验证合约
  if (hre.network.name === "sepolia") {
    console.log(`\n提示: 您可以使用以下命令验证合约:`);
    console.log(`npx hardhat verify --network sepolia ${PoolManager.address}`);
    console.log(`npx hardhat verify --network sepolia ${SwapRouter.address} ${PoolManager.address}`);
    console.log(`npx hardhat verify --network sepolia ${PositionManager.address} ${PoolManager.address}`);
    
    console.log(`\n注意事项:`);
    console.log(`1. 验证合约前，请确保等待足够的区块确认时间`);
    console.log(`2. 如果验证失败，可能需要等待几分钟后重试`);
    console.log(`3. 您可以在Sepolia区块浏览器(https://sepolia.etherscan.io/)上查看合约状态`);
  }
}

// 执行部署并处理错误
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("部署过程中出现错误:", error);
    process.exit(1);
  });