// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Counter {
    uint256 private count;

    // 事件，当计数改变时触发
    event CountChanged(string action, uint256 newCount);

    // 构造函数，初始化计数为0
    constructor() {
        count = 0;
    }

    // 获取当前计数
    function getCount() public view returns (uint256) {
        return count;
    }

    // 增加计数
    function increment() public {
        count += 1;
        emit CountChanged("increment", count);
    }

    // 减少计数
    function decrement() public {
        require(count > 0, "Count cannot be negative");
        count -= 1;
        emit CountChanged("decrement", count);
    }

    // 重置计数为0
    function reset() public {
        require(count > 0, "Count must be greater than 0");
        count = 0;
        emit CountChanged("reset", count);
    }
}