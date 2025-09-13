// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import {Script} from "forge-std/Script.sol";
import {console} from "forge-std/console.sol";
import {CounterOptimized} from "../src/CounterOptimized.sol";

// 验证脚本 - 用于测试已部署的CounterOptimized合约功能
contract VerifyCounterOptimized is Script {
    // 已部署的CounterOptimized合约地址
    address constant DEPLOYED_CONTRACT_ADDRESS = 0xFEeDE0C07608525F509bFfb4f08F814820Ee0929;

    // 主函数 - 执行验证流程
    function run() public {
        console.log(unicode"开始验证已部署的CounterOptimized合约功能...");
        console.log(unicode"合约地址: ", DEPLOYED_CONTRACT_ADDRESS);
        console.log(unicode"RPC URL: ", vm.envString("SEPOLIA_URL"));
        console.log("\n");

        // 获取已部署合约的实例
        CounterOptimized counter = CounterOptimized(DEPLOYED_CONTRACT_ADDRESS);

        // 测试1: 读取当前计数值
        uint256 currentValue = counter.number();
        console.log(unicode"测试1: 读取当前计数值");
        console.log(unicode"当前计数值: ", currentValue);
        console.log("\n");

        // 测试2: 调用increment函数增加计数
        console.log(unicode"测试2: 调用increment函数增加计数");
        // 使用广播模式调用合约函数
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);
        counter.increment();
        vm.stopBroadcast();
        
        // 等待交易确认后读取新值
        uint256 newValueAfterIncrement = counter.number();
        console.log(unicode"调用increment后计数值: ", newValueAfterIncrement);
        console.log(unicode"预期结果: ", currentValue + 1);
        console.log(unicode"测试结果: ", newValueAfterIncrement == currentValue + 1 ? unicode"通过" : unicode"失败");
        console.log("\n");

        // 测试3: 调用add函数增加指定值
        console.log(unicode"测试3: 调用add函数增加指定值");
        uint64 addValue = 5;
        vm.startBroadcast(deployerPrivateKey);
        counter.add(addValue);
        vm.stopBroadcast();
        
        // 等待交易确认后读取新值
        uint256 newValueAfterAdd = counter.number();
        console.log(unicode"增加的值: ", addValue);
        console.log(unicode"调用add后计数值: ", newValueAfterAdd);
        console.log(unicode"预期结果: ", newValueAfterIncrement + addValue);
        console.log(unicode"测试结果: ", newValueAfterAdd == newValueAfterIncrement + addValue ? unicode"通过" : unicode"失败");
        console.log("\n");

        // 测试4: 调用decrement函数减少计数
        console.log(unicode"测试4: 调用decrement函数减少计数");
        vm.startBroadcast(deployerPrivateKey);
        counter.decrement();
        vm.stopBroadcast();
        
        // 等待交易确认后读取新值
        uint256 newValueAfterDecrement = counter.number();
        console.log(unicode"调用decrement后计数值: ", newValueAfterDecrement);
        console.log(unicode"预期结果: ", newValueAfterAdd - 1);
        console.log(unicode"测试结果: ", newValueAfterDecrement == newValueAfterAdd - 1 ? unicode"通过" : unicode"失败");
        console.log("\n");

        // 测试5: 调用reset函数重置计数
        console.log(unicode"测试5: 调用reset函数重置计数");
        vm.startBroadcast(deployerPrivateKey);
        counter.reset();
        vm.stopBroadcast();
        
        // 等待交易确认后读取新值
        uint256 newValueAfterReset = counter.number();
        console.log(unicode"调用reset后计数值: ", newValueAfterReset);
        console.log(unicode"预期结果: 0");
        console.log(unicode"测试结果: ", newValueAfterReset == 0 ? unicode"通过" : unicode"失败");
        console.log("\n");

        console.log(unicode"验证测试完成！");
    }
}