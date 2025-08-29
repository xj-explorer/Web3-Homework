// 升级Counter合约的脚本
const { ethers, upgrades } = require("hardhat");

async function main() {
    console.log("正在准备升级Counter合约...");
    
    // 输入代理合约地址
    // 注意：需要替换为实际部署的代理合约地址
    const proxyAddress = "0x2653e2f4485D95c5737fe0274E9B9A83E0c0A318"; // 默认的本地部署地址，可能需要修改
    
    // 获取Counter_v2合约的工厂
    const Counter_v2 = await ethers.getContractFactory("Counter_v2");
    
    console.log(`正在将代理合约 ${proxyAddress} 升级到 Counter_v2...`);
    
    // 使用OpenZeppelin的upgrades.upgradeProxy方法升级合约
    // 第一个参数是代理合约地址
    // 第二个参数是新的实现合约工厂
    const upgraded = await upgrades.upgradeProxy(proxyAddress, Counter_v2);
    
    // 等待升级交易完成
    await upgraded.waitForDeployment();
    
    // 获取升级后的实现合约地址
    const newImplementationAddress = await upgrades.erc1967.getImplementationAddress(proxyAddress);
    
    console.log(`合约升级成功！`);
    console.log(`新的实现合约地址: ${newImplementationAddress}`);
    
    // 验证新的实现合约（可选）
    console.log("\n升级完成。您可以使用以下命令验证新的实现合约：");
    console.log(`npx hardhat verify --network localhost ${newImplementationAddress}`);
    console.log(`npx hardhat verify --network sepolia ${newImplementationAddress}`);
    
    // 提醒用户在生产环境中需要验证升级的安全性
    console.log("\n重要提示：在生产环境中，建议在升级前使用 OpenZeppelin Defender 等工具进行安全验证！");
}

// 执行主函数
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });