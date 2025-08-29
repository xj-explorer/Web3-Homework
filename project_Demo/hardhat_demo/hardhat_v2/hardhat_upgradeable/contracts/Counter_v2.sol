// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./CounterUpgradeable.sol";

contract Counter_v2 is CounterUpgradeable {
    // 事件，当helloWorld函数被调用时触发
    event HelloWorldCalled(address caller, string message);

    // 重写increment方法，增加更多的功能
    function increment() public override {
        count += 2; // 在v2版本中，每次增加2而不是1
        emit CountChanged("increment_v2", count);
    }

    // 重写reset方法，添加更多的验证
    function reset() public override {
        require(count > 0, "Count must be greater than 0");
        uint256 oldCount = count;
        count = 0;
        emit CountChanged("reset_v2", 0);
        // 添加一个日志，表示重置了多少计数
        emit CountChanged("reset_amount", oldCount);
    }

    // 添加一个新的multiply函数，可以将计数乘以指定的倍数
    function multiply(uint256 multiplier) public {
        require(multiplier > 0, "Multiplier must be greater than 0");
        count *= multiplier;
        emit CountChanged("multiply", count);
    }

    // 添加一个简单的helloworld函数，标记为view
    function helloWorld() public view returns (string memory) {
        string memory message = "Hello World from Counter_v2!";
        return message;
    }

    // 注意：由于我们继承自CounterUpgradeable，需要确保gap的大小与父合约一致
    // `__gap` 是为了确保合约升级安全而添加的存储间隙。在可升级合约中，
    // 后续版本可能需要添加新的状态变量，为了避免新添加的状态变量与旧版本的存储布局冲突，
    // 存储布局冲突指的是，当合约升级添加新状态变量时，新变量的存储位置可能会与旧版本中已有的变量存储位置重叠，导致数据读取和写入错误。
    // 为了避免这种冲突，会预留一些未使用的存储空间。这个存储间隙通常定义为 `uint256` 数组，
    // 其大小需要与父合约一致。这里的 `uint256[49]` 表示预留了 49 个 `uint256` 大小的存储空间
    uint256[49] private __gap;
}