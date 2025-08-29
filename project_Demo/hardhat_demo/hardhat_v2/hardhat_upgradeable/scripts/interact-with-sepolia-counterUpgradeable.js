const { ethers } = require("hardhat");

async function main() {
    console.log("正在连接到Sepolia测试网络...");
    
    // 不需要显式指定provider，Hardhat会根据--network参数自动连接到Sepolia网络
    
    // 获取第一个账户作为调用者
    const [signer] = await ethers.getSigners();
    console.log(`使用账户: ${signer.address}`);
    
    // 检查账户余额
    const balance = await ethers.provider.getBalance(signer.address);
    console.log(`账户余额: ${ethers.formatEther(balance)} ETH`);
    
    // 加载CounterUpgradeable合约工厂
    const CounterUpgradeable = await ethers.getContractFactory("CounterUpgradeable");
    
    // Sepolia测试网络上已部署的可升级合约代理地址
    // 注意：在可升级合约模式中，始终使用代理合约地址进行交互
    const proxyContractAddress = "0x2653e2f4485D95c5737fe0274E9B9A83E0c0A318";
    
    console.log(`正在连接到可升级合约代理地址: ${proxyContractAddress}`);
    
    // 连接到已部署的代理合约实例
    const counterProxy = await CounterUpgradeable.attach(proxyContractAddress);
    
    // 查看当前计数值（这是一个read-only操作，不需要花费Gas）
    console.log("读取当前计数值...");
    let currentCount = await counterProxy.getCount();
    console.log(`当前计数值: ${currentCount}`);
    
    // 增加计数（这是一个写操作，需要花费Gas）
    console.log("执行增加计数操作...");
    console.log("注意：这是一个链上交易，需要等待网络确认...");
    const incrementTx = await counterProxy.increment();
    console.log(`等待交易确认，交易哈希: ${incrementTx.hash}`);
    
    // 等待交易确认（在Sepolia测试网络上通常需要10-30秒）
    console.log("正在等待区块确认...");
    await incrementTx.wait();
    console.log("交易已确认！");
    
    // 再次查看计数值
    currentCount = await counterProxy.getCount();
    console.log(`增加后计数值: ${currentCount}`);
    
    // 减少计数
    console.log("执行减少计数操作...");
    const decrementTx = await counterProxy.decrement();
    console.log(`等待交易确认，交易哈希: ${decrementTx.hash}`);
    await decrementTx.wait();
    console.log("交易已确认！");
    
    // 再次查看计数值
    currentCount = await counterProxy.getCount();
    console.log(`减少后计数值: ${currentCount}`);
    
    // 重置计数
    console.log("执行重置计数操作...");
    await counterProxy.increment();
    await counterProxy.increment();
    const currentInc = await counterProxy.getCount();
    console.log(`先增加: ${currentInc}`);
    const resetTx = await counterProxy.reset();
    console.log(`等待交易确认，交易哈希: ${resetTx.hash}`);
    await resetTx.wait();
    console.log("交易已确认！");
    
    // 最终查看计数值
    currentCount = await counterProxy.getCount();
    console.log(`重置后计数值: ${currentCount}`);
    
    // 如果合约已升级到Counter_v2版本，调用v2版本特有的方法
    try {
        console.log("尝试调用v2版本特有的helloWorld方法...");
        const helloWorldMessage = await counterProxy.helloWorld();
        console.log(`helloWorld方法返回: ${helloWorldMessage}`);
        
        console.log("尝试调用v2版本特有的multiply方法...");
        const multiplyResult = await counterProxy.multiply(5);
        console.log(`multiply(5)方法返回: ${multiplyResult}`);
    } catch (error) {
        console.log("注意：无法调用v2版本特有的方法，可能是合约尚未升级到v2版本。");
        console.log("错误信息: ", error.message);
    }
    
    // 检查合约拥有者
    console.log("检查合约拥有者...");
    const owner = await counterProxy.owner();
    console.log(`合约拥有者: ${owner}`);
    
    // 如果当前账户是合约拥有者，可以执行一些只有拥有者才能执行的操作
    if (owner.toLowerCase() === signer.address.toLowerCase()) {
        console.log("当前账户是合约拥有者，可以执行拥有者操作。");
        // 这里可以添加只有拥有者才能执行的操作示例
    } else {
        console.log("当前账户不是合约拥有者，无法执行拥有者操作。");
    }
    
    console.log("Sepolia测试网络可升级合约交互完成!");
    console.log(`您可以在Etherscan上查看交易: https://sepolia.etherscan.io/address/${proxyContractAddress}`);
    console.log(`
使用提示:`);
    console.log(`1. 在执行此脚本前，请确保已将YOUR_PROXY_CONTRACT_ADDRESS替换为实际的代理合约地址`);
    console.log(`2. 确保.env文件中配置了正确的SEPOLIA_URL和PRIVATE_KEY`);
    console.log(`3. 确保您的账户中有足够的Sepolia ETH用于支付Gas费用`);
    console.log(`4. 如果合约已升级到v2版本，脚本会自动尝试调用v2版本特有的方法`);
}

// 执行主函数
main()
    // 当主函数成功执行完成后，调用此回调函数
    // 以状态码 0 退出进程，表示程序正常结束
    .then(() => process.exit(0))
    // 当主函数执行过程中抛出错误时，捕获该错误
    .catch((error) => {
        // 将错误信息输出到控制台
        console.error(error);
        // 以状态码 1 退出进程，表示程序异常结束
        process.exit(1);
    });