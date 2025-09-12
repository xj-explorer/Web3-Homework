// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Test} from "forge-std/Test.sol";
import {Counter} from "../src/Counter.sol";

contract CounterTest is Test {
    Counter public counter;

    function setUp() public {
        // 创建计数器实例，初始值为0
        counter = new Counter(0);
    }

    // 测试初始值
    function test_InitialValue() public view {
        assertEq(counter.number(), 0);
    }

    // 测试带不同参数的构造函数
    function test_ConstructorWithValue() public {
        // 测试构造函数事件触发
        // vm.expectEmit 用于声明接下来的操作会触发一个事件，参数含义如下：
        // 第一个 true：检查事件的第一个 topic（通常是事件签名，即事件名）
        // 第二个 true：检查事件的第二个 topic（通常是第一个索引参数）
        // 第三个 false：不检查事件的第三个 topic（通常是第二个索引参数）
        // 第四个 true：检查事件的数据（非索引参数）
        vm.expectEmit(true, true, false, true);
        // 手动触发一个 Counter 合约的 Change 事件，模拟创建 Counter 合约实例时触发的事件
        emit Counter.Change("INITIALIZE", 42);
        Counter newCounter = new Counter(42);
        assertEq(newCounter.number(), 42);
    }

    // 测试设置新值
    function test_SetNumber() public {
        // 测试setNumber函数的事件触发
        vm.expectEmit(true, true, false, true);
        emit Counter.Change("SET", 10);
        counter.setNumber(10);
        assertEq(counter.number(), 10);
    }

    // 测试递增函数
    function test_Increment() public {
        // 测试increment函数的事件触发
        vm.expectEmit(true, true, false, true);
        emit Counter.Change("INCREMENT", 1);
        counter.increment();
        assertEq(counter.number(), 1);
        
        // 多次递增测试
        counter.increment();
        counter.increment();
        assertEq(counter.number(), 3);
    }

    // 测试添加指定值
    function test_Add() public {
        // 测试add函数的事件触发
        vm.expectEmit(true, true, false, true);
        emit Counter.Change("ADD", 5);
        counter.add(5);
        assertEq(counter.number(), 5);
        
        vm.expectEmit(true, true, false, true);
        emit Counter.Change("ADD", 10);
        counter.add(10);
        assertEq(counter.number(), 15);
    }

    // 测试递减函数
    function test_Decrement() public {
        counter.setNumber(3);
        
        // 测试decrement函数的事件触发
        vm.expectEmit(true, true, false, true);
        emit Counter.Change("DECREMENT", 1);
        counter.decrement();
        assertEq(counter.number(), 2);
        
        counter.decrement();
        counter.decrement();
        assertEq(counter.number(), 0);
    }

    // 测试递减到负数的异常情况
    function test_DecrementBelowZero() public {
        // 当计数器已经为0时，调用decrement应该抛出异常
        vm.expectRevert("Counter: cannot decrement below zero");
        counter.decrement();
    }

    // 测试减去指定值
    function test_Subtract() public {
        counter.setNumber(10);
        
        // 测试subtract函数的事件触发
        vm.expectEmit(true, true, false, true);
        emit Counter.Change("SUBTRACT", 3);
        counter.subtract(3);
        assertEq(counter.number(), 7);
        
        vm.expectEmit(true, true, false, true);
        emit Counter.Change("SUBTRACT", 7);
        counter.subtract(7);
        assertEq(counter.number(), 0);
    }

    // 测试减去过多值的异常情况
    function test_SubtractBelowZero() public {
        counter.setNumber(5);
        vm.expectRevert("Counter: cannot subtract below zero");
        counter.subtract(10);
    }

    // 测试乘法运算
    function test_Multiply() public {
        counter.setNumber(2);
        
        // 测试multiply函数的事件触发
        vm.expectEmit(true, true, false, true);
        emit Counter.Change("MULTIPLY", 3);
        counter.multiply(3);
        assertEq(counter.number(), 6);
        
        vm.expectEmit(true, true, false, true);
        emit Counter.Change("MULTIPLY", 0);
        counter.multiply(0);
        assertEq(counter.number(), 0);
    }

    // 测试重置功能
    function test_Reset() public {
        counter.setNumber(42);
        
        // 测试reset函数的事件触发
        vm.expectEmit(true, true, false, true);
        emit Counter.Change("RESET", 0);
        counter.reset();
        assertEq(counter.number(), 0);
    }

    // 模糊测试 - 设置任意值
    function testFuzz_SetNumber(uint256 x) public {
        vm.expectEmit(true, true, false, true);
        emit Counter.Change("SET", x);
        counter.setNumber(x);
        assertEq(counter.number(), x);
    }

    // 模糊测试 - 加法运算
    function testFuzz_Add(uint256 initialValue, uint256 addValue) public {
        // 避免溢出
        // 使用 vm.assume 确保测试用例的有效性，避免加法运算时发生溢出。
        // initialValue 和 addValue 相加可能会超过 uint256 的最大值，
        // 通过这个假设条件，确保 initialValue 加上 addValue 的结果不会超过 uint256 的最大值，
        // 即 initialValue <= type(uint256).max - addValue。（ <=：小于等于 ）
        vm.assume(initialValue <= type(uint256).max - addValue);
        counter.setNumber(initialValue);
        vm.expectEmit(true, true, false, true);
        emit Counter.Change("ADD", addValue);
        counter.add(addValue);
        assertEq(counter.number(), initialValue + addValue);
    }

    // 模糊测试 - 乘法运算
    function testFuzz_Multiply(uint256 initialValue, uint256 multiplier) public {
        // 避免溢出
        vm.assume(multiplier == 0 || initialValue <= type(uint256).max / multiplier);
        
        counter.setNumber(initialValue);
        vm.expectEmit(true, true, false, true);
        emit Counter.Change("MULTIPLY", multiplier);
        counter.multiply(multiplier);
        assertEq(counter.number(), initialValue * multiplier);
    }

    // 测试构造函数的事件触发
    function test_ConstructorEvent() public {
        vm.expectEmit(true, true, false, true);
        emit Counter.Change("INITIALIZE", 0);
        Counter newCounter = new Counter(0);
        assertEq(newCounter.number(), 0);
    }

    // 测试递减事件
    function test_DecrementEvent() public {
        counter.setNumber(1);
        vm.expectEmit(true, true, false, true);
        emit Counter.Change("DECREMENT", 1);
        counter.decrement();
        assertEq(counter.number(), 0);
    }

    // 测试减法事件
    function test_SubtractEvent() public {
        counter.setNumber(5);
        vm.expectEmit(true, true, false, true);
        emit Counter.Change("SUBTRACT", 3);
        counter.subtract(3);
        assertEq(counter.number(), 2);
    }

    // 辅助函数，允许测试中捕获Counter合约的事件
    event Change(string operation, uint256 value);
}
