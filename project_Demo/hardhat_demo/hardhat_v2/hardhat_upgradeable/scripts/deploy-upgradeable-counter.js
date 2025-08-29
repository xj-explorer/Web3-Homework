// 部署可升级Counter合约的脚本
const { ethers, upgrades } = require("hardhat");

async function main() {
    console.log("正在部署可升级的Counter合约...");
    
    // 获取CounterUpgradeable合约的工厂
    const CounterUpgradeable = await ethers.getContractFactory("CounterUpgradeable");
    
    // 使用OpenZeppelin的upgrades.deployProxy方法部署可升级合约
    // 第一个参数是合约工厂
    // 第二个参数是传递给initialize函数的参数数组（这里为空）
    // 第三个参数是部署选项，指定使用UUPS代理模式
    const counter = await upgrades.deployProxy(CounterUpgradeable, [], { initializer: "initialize", kind: "uups" });
    
    // 等待合约部署完成
    await counter.waitForDeployment();
    
    // 获取代理合约地址
    const proxyAddress = await counter.getAddress();
    
    // 获取实现合约地址
    const implementationAddress = await upgrades.erc1967.getImplementationAddress(proxyAddress);
    
    console.log(`可升级合约部署成功！`);
    console.log(`代理合约地址: ${proxyAddress}`);
    console.log(`实现合约地址: ${implementationAddress}`);
    
    // 验证合约（可选，需要配置ETHERSCAN_API_KEY）
    console.log("\n部署完成。您可以使用以下命令验证合约：");
    console.log(`npx hardhat verify --network localhost ${implementationAddress}`);
    console.log(`npx hardhat verify --network sepolia ${implementationAddress}`);
}

// 执行主函数
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });