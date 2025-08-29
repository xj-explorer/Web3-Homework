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
    
    // 加载Counter合约工厂
    const Counter = await ethers.getContractFactory("Counter");
    
    // Sepolia测试网络上已部署的合约地址
    const contractAddress = "0xf37E97E38C82DA4E3aE62e8cCa76aFf3329F6B07";
    
    console.log(`正在连接到合约: ${contractAddress}`);
    
    // 连接到已部署的合约实例
    const counter = await Counter.attach(contractAddress);
    
    // 查看当前计数值（这是一个read-only操作，不需要花费Gas）
    console.log("读取当前计数值...");
    let currentCount = await counter.getCount();
    console.log(`当前计数值: ${currentCount}`);
    
    // 增加计数（这是一个写操作，需要花费Gas）
    console.log("执行增加计数操作...");
    console.log("注意：这是一个链上交易，需要等待网络确认...");
    const incrementTx = await counter.increment();
    console.log(`等待交易确认，交易哈希: ${incrementTx.hash}`);
    
    // 等待交易确认（在Sepolia测试网络上通常需要10-30秒）
    console.log("正在等待区块确认...");
    await incrementTx.wait();
    console.log("交易已确认！");
    
    // 再次查看计数值
    currentCount = await counter.getCount();
    console.log(`增加后计数值: ${currentCount}`);
    
    // 减少计数
    console.log("执行减少计数操作...");
    const decrementTx = await counter.decrement();
    console.log(`等待交易确认，交易哈希: ${decrementTx.hash}`);
    await decrementTx.wait();
    console.log("交易已确认！");
    
    // 再次查看计数值
    currentCount = await counter.getCount();
    console.log(`减少后计数值: ${currentCount}`);
    
    // 重置计数
    console.log("执行重置计数操作...");
    await counter.increment();
    currentInc = await counter.getCount();
    console.log(`先增加1: ${currentInc}`);
    const resetTx = await counter.reset();
    console.log(`等待交易确认，交易哈希: ${resetTx.hash}`);
    await resetTx.wait();
    console.log("交易已确认！");
    
    // 最终查看计数值
    currentCount = await counter.getCount();
    console.log(`重置后计数值: ${currentCount}`);
    
    console.log("Sepolia测试网络合约交互完成!");
    console.log(`您可以在Etherscan上查看交易: https://sepolia.etherscan.io/address/${contractAddress}`);
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