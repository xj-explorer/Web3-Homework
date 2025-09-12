// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

contract Counter {
    // 存储计数器当前值
    uint256 public number;

    // 定义change事件，第一个参数为操作类型，第二个参数为变化的数值
    event Change(string operation, uint256 value);

    // 构造函数，接收初始值
    constructor(uint256 initialNumber) {
        number = initialNumber;
        emit Change("INITIALIZE", initialNumber);
    }

    // 设置计数器新值
    function setNumber(uint256 newNumber) public {
        // 触发SET事件，记录新值
        emit Change("SET", newNumber);
        number = newNumber;
    }

    // 计数器加1
    function increment() public {
        number++;
        emit Change("INCREMENT", 1);
    }

    // 计数器加指定值
    function add(uint256 value) public {
        number += value;
        emit Change("ADD", value);
    }

    // 计数器减1
    function decrement() public {
        require(number > 0, "Counter: cannot decrement below zero");
        number--;
        emit Change("DECREMENT", 1);
    }

    // 计数器减指定值
    function subtract(uint256 value) public {
        require(number >= value, "Counter: cannot subtract below zero");
        number -= value;
        emit Change("SUBTRACT", value);
    }

    // 计数器乘以指定值
    function multiply(uint256 value) public {
        number *= value;
        emit Change("MULTIPLY", value);
    }

    // 重置计数器为0
    function reset() public {
        number = 0;
        emit Change("RESET", 0);
    }
}
