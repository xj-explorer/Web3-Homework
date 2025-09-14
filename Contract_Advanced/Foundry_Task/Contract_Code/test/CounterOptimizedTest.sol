pragma solidity ^0.8.13;

import {Test} from "forge-std/Test.sol";
import {CounterOptimized} from "../src/CounterOptimized.sol";

/**
 * CounterOptimized合约功能测试 - 专注于测试边界条件和失败情况
 */
contract CounterOptimizedTest is Test {
    CounterOptimized public counter;

    /**
     * 设置测试环境，部署优化版合约
     */
    function setUp() public {
        counter = new CounterOptimized(0);
    }

    /**
     * 测试decrement函数在计数器为0时的失败情况
     * 验证require条件：number > 0
     */
    function test_Fail_DecrementBelowZero() public {
        // 计数器初始值为0
        assertEq(counter.number(), 0);
        
        // 尝试在计数器为0时调用decrement函数，预期会失败
        vm.expectRevert("Counter: cannot decrement below zero");
        counter.decrement();
    }

    /**
     * 测试subtract函数在减去值大于当前值时的失败情况
     * 验证require条件：number >= value
     */
    function test_Fail_SubtractBelowZero() public {
        // 设置计数器值为10
        counter.setNumber(10);
        assertEq(counter.number(), 10);
        
        // 尝试减去一个大于当前值的值(20)，预期会失败
        vm.expectRevert("Counter: cannot subtract below zero");
        counter.subtract(20);
    }

    /**
     * 测试subtract函数刚好减去等于当前值的值
     * 这是require条件的边界情况：number == value
     */
    function test_SubtractEqualToValue() public {
        // 设置计数器值为10
        counter.setNumber(10);
        assertEq(counter.number(), 10);
        
        // 减去一个等于当前值的值(10)
        counter.subtract(10);
        
        // 验证计数器值为0
        assertEq(counter.number(), 0);
    }

    /**
     * 测试decrement函数在计数器为1时的边界情况
     * 这是require条件的边界情况：number == 1
     */
    function test_DecrementAtBoundary() public {
        // 设置计数器值为1
        counter.setNumber(1);
        assertEq(counter.number(), 1);
        
        // 调用decrement函数
        counter.decrement();
        
        // 验证计数器值为0
        assertEq(counter.number(), 0);
    }

    /**
     * 测试subtract函数在边界条件下的Gas消耗
     */
    function test_Gas_SubtractAtBoundary() public {
        // 设置计数器值为100
        counter.setNumber(100);
        
        // 测量刚好减去等于当前值的Gas消耗
        uint256 gasStart = gasleft();
        counter.subtract(100);
        uint256 gasEnd = gasleft();
        uint256 gasUsed = gasStart - gasEnd;
        
        emit log_named_uint(unicode"优化版:边界条件下subtract(100)的Gas消耗:", gasUsed);
        assertEq(counter.number(), 0);
    }

    /**
     * 测试decrement函数在边界条件下的Gas消耗
     */
    function test_Gas_DecrementAtBoundary() public {
        // 设置计数器值为1
        counter.setNumber(1);
        
        // 测量边界条件下decrement的Gas消耗
        uint256 gasStart = gasleft();
        counter.decrement();
        uint256 gasEnd = gasleft();
        uint256 gasUsed = gasStart - gasEnd;
        
        emit log_named_uint(unicode"优化版:边界条件下decrement的Gas消耗:", gasUsed);
        assertEq(counter.number(), 0);
    }
}