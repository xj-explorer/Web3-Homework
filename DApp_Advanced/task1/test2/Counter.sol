// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Counter {
    uint256 private count;
    event changeCount(string action, uint256 by, uint256 newCount);

    // 构造函数，初始化计数器为0
    constructor() {
        count = 0;
    }

    // 增加计数器的值
    function increment() public {
        count += 1;
        emit changeCount("increment", 1, count);
    }

    // 减少计数器的值
    function decrement() public {
        require(count > 0, "Count cannot be negative");
        count -= 1;
        emit changeCount("decrement", 1, count);
    }

    // 获取当前计数器的值
    function getCount() public view returns (uint256) {
        return count;
    }

    // 重置计数器
    function reset() public {
        emit changeCount("reset", count, 0);
        count = 0;
    }
}