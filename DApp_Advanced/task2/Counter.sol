// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Counter {
    uint256 private count;

    // 构造函数，初始化计数器为0
    constructor() {
        count = 0;
    }

    // 增加计数器的值
    function increment() public {
        count += 1;
    }

    // 获取当前计数器的值
    function getCount() public view returns (uint256) {
        return count;
    }

    // 重置计数器
    function reset() public {
        count = 0;
    }
}