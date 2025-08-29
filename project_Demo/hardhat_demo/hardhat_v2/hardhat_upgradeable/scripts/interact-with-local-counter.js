// 与本地网络部署的Counter合约交互的脚本
const { ethers } = require("hardhat");

async function main() {
    console.log("正在连接到本地Hardhat网络...");
    
    // 连接到本地Hardhat网络
    const provider = new ethers.JsonRpcProvider("http://localhost:8545");
    
    // 获取第一个账户作为调用者
    const [signer] = await ethers.getSigners();
    console.log(`使用账户: ${signer.address}`);
    
    // 加载Counter合约工厂
    const Counter = await ethers.getContractFactory("Counter");
    
    // 请将这里的地址替换为实际部署的合约地址
    // 部署时控制台会输出合约地址
    const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
    
    console.log(`正在连接到合约: ${contractAddress}`);
    
    // 连接到已部署的合约实例
    const counter = await Counter.attach(contractAddress);
    
    // 查看当前计数值
    let currentCount = await counter.getCount();
    console.log(`当前计数值: ${currentCount}`);
    
    // 增加计数
    console.log("执行增加计数操作...");
    const incrementTx = await counter.increment();
    await incrementTx.wait(); // 等待交易确认
    console.log(`交易哈希: ${incrementTx.hash}`);
    
    // 再次查看计数值
    currentCount = await counter.getCount();
    console.log(`增加后计数值: ${currentCount}`);
    
    // 减少计数
    console.log("执行减少计数操作...");
    const decrementTx = await counter.decrement();
    await decrementTx.wait(); // 等待交易确认
    console.log(`交易哈希: ${decrementTx.hash}`);
    
    // 再次查看计数值
    currentCount = await counter.getCount();
    console.log(`减少后计数值: ${currentCount}`);
    
    // 重置计数
    console.log("执行重置计数操作...");
    const resetTx = await counter.reset();
    await resetTx.wait(); // 等待交易确认
    console.log(`交易哈希: ${resetTx.hash}`);
    
    // 最终查看计数值
    currentCount = await counter.getCount();
    console.log(`重置后计数值: ${currentCount}`);
    
    console.log("合约交互完成!");
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