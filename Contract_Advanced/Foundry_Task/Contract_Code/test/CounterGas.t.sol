// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Test} from "forge-std/Test.sol";
import {Counter} from "../src/Counter.sol";

contract CounterGasTest is Test {
    Counter public counter;

    // Gas消耗记录变量
    uint256 public gasBefore;
    uint256 public gasAfter;
    uint256 public gasUsed;

    function setUp() public {
        counter = new Counter(0);
    }

    // 测试构造函数的Gas消耗
    function test_Gas_Constructor() public {
        uint256 gasStart = gasleft();
        Counter newCounter = new Counter(42);
        uint256 gasEnd = gasleft();
        gasUsed = gasStart - gasEnd;
        // `log_named_uint` 是在 `forge-std` 库中定义的事件，在导入的 `Test` 合约里可用，通过 `import {Test} from "forge-std/Test.sol";` 引入。
        emit log_named_uint("Constructor Gas Used:", gasUsed);
        assertEq(newCounter.number(), 42);
    }

    // 测试setNumber函数的Gas消耗
    function test_Gas_SetNumber() public {
        gasBefore = gasleft();
        counter.setNumber(100);
        gasAfter = gasleft();
        gasUsed = gasBefore - gasAfter;
        emit log_named_uint("setNumber Gas Used:", gasUsed);
        assertEq(counter.number(), 100);
    }

    // 测试increment函数的Gas消耗
    function test_Gas_Increment() public {
        gasBefore = gasleft();
        counter.increment();
        gasAfter = gasleft();
        gasUsed = gasBefore - gasAfter;
        emit log_named_uint("increment Gas Used:", gasUsed);
        assertEq(counter.number(), 1);
    }

    // 测试add函数的Gas消耗
    function test_Gas_Add() public {
        gasBefore = gasleft();
        counter.add(50);
        gasAfter = gasleft();
        gasUsed = gasBefore - gasAfter;
        emit log_named_uint("add(50) Gas Used:", gasUsed);
        assertEq(counter.number(), 50);
    }

    // 测试decrement函数的Gas消耗
    function test_Gas_Decrement() public {
        counter.setNumber(10);
        gasBefore = gasleft();
        counter.decrement();
        gasAfter = gasleft();
        gasUsed = gasBefore - gasAfter;
        emit log_named_uint("decrement Gas Used:", gasUsed);
        assertEq(counter.number(), 9);
    }

    // 测试subtract函数的Gas消耗
    function test_Gas_Subtract() public {
        counter.setNumber(100);
        gasBefore = gasleft();
        counter.subtract(30);
        gasAfter = gasleft();
        gasUsed = gasBefore - gasAfter;
        emit log_named_uint("subtract(30) Gas Used:", gasUsed);
        assertEq(counter.number(), 70);
    }

    // 测试multiply函数的Gas消耗
    function test_Gas_Multiply() public {
        counter.setNumber(5);
        gasBefore = gasleft();
        counter.multiply(10);
        gasAfter = gasleft();
        gasUsed = gasBefore - gasAfter;
        emit log_named_uint("multiply(10) Gas Used:", gasUsed);
        assertEq(counter.number(), 50);
    }

    // 测试reset函数的Gas消耗
    function test_Gas_Reset() public {
        counter.setNumber(1000);
        gasBefore = gasleft();
        counter.reset();
        gasAfter = gasleft();
        gasUsed = gasBefore - gasAfter;
        emit log_named_uint("reset Gas Used:", gasUsed);
        assertEq(counter.number(), 0);
    }

    // 比较不同操作的Gas消耗效率
    function test_Gas_Comparison() public {
        // 准备多个计数器实例
        Counter counter1 = new Counter(0);
        Counter counter2 = new Counter(0);
        
        // 测量多次increment与单次add的Gas消耗比较
        uint256 gasStart1 = gasleft();
        for (uint256 i = 0; i < 5; i++) {
            counter1.increment();
        }
        uint256 gasEnd1 = gasleft();
        uint256 gasUsed1 = gasStart1 - gasEnd1;
        
        uint256 gasStart2 = gasleft();
        counter2.add(5);
        uint256 gasEnd2 = gasleft();
        uint256 gasUsed2 = gasStart2 - gasEnd2;
        
        emit log_named_uint(unicode"5次increment的Gas消耗:", gasUsed1);
        emit log_named_uint(unicode"1次add(5)的Gas消耗:", gasUsed2);
        emit log_named_string(unicode"更高效的操作:", gasUsed1 < gasUsed2 ? unicode"多次increment" : unicode"单次add");
        
        assertEq(counter1.number(), 5);
        assertEq(counter2.number(), 5);
    }
    
    // 测量读取number()函数的Gas消耗
    function test_Gas_ReadNumber() public {
        gasBefore = gasleft();
        uint256 num = counter.number();
        gasAfter = gasleft();
        gasUsed = gasBefore - gasAfter;
        emit log_named_uint(unicode"读取number()的Gas消耗:", gasUsed);
        assertEq(num, 0);
    }
}