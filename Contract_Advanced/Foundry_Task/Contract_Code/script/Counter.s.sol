// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Script} from "forge-std/Script.sol";
import {console} from "forge-std/console.sol";
import {Counter} from "../src/Counter.sol";
import {CounterOptimized} from "../src/CounterOptimized.sol";

// 部署脚本 - 支持部署到Sepolia测试网
contract CounterScript is Script {
    Counter public counter;
    CounterOptimized public counterOptimized;

    // 设置函数 - 用于初始化
    function setUp() public {
        // 加载环境变量（通过Foundry自动处理）
    }

    // 部署原始版本Counter合约
    function deployCounter() public {
        // 从环境变量获取私钥并开始广播交易
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        // 部署Counter合约，初始值设为0
        counter = new Counter(0);

        vm.stopBroadcast();

        // 输出部署信息
        console.log(unicode"Counter合约部署完成！");
        console.log(unicode"合约地址: ", address(counter));
        console.log(unicode"部署者: ", vm.addr(deployerPrivateKey));
    }

    // 部署优化版本CounterOptimized合约
    function deployCounterOptimized() public {
        // 从环境变量获取私钥并开始广播交易
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        // 部署CounterOptimized合约，初始值设为0
        counterOptimized = new CounterOptimized(0);

        vm.stopBroadcast();

        // 输出部署信息
        console.log(unicode"CounterOptimized合约部署完成！");
        console.log(unicode"合约地址: ", address(counterOptimized));
        console.log(unicode"部署者: ", vm.addr(deployerPrivateKey));
    }

    // 主函数 - 部署两种合约
    function run() public {
        console.log(unicode"开始部署合约到Sepolia测试网...");
        console.log("RPC URL: ", vm.envString("SEPOLIA_URL"));
        
        // 部署原始版本
        deployCounter();
        console.log("\n");
        
        // 部署优化版本
        deployCounterOptimized();
    }
}
