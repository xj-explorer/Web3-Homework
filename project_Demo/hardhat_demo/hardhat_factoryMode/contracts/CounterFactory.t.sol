// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "forge-std/Test.sol";
import "./CounterFactory.sol";
import "./Counter.sol";

/**
 * @title CounterFactoryTest
 * @dev 使用Foundry测试框架测试CounterFactory合约
 */
contract CounterFactoryTest is Test {
    CounterFactory public factory;
    address public owner;
    address public user1;
    address public user2;

    // 在测试开始前设置环境
    function setUp() public {
        owner = address(this);
        user1 = address(0x1);
        user2 = address(0x2);
        
        // 部署CounterFactory合约
        factory = new CounterFactory();
    }

    /**
     * @dev 测试合约部署是否成功
     */
    function test_Deploy() public {
        // 验证工厂合约地址不为空
        assertTrue(address(factory) != address(0));
        
        // 验证初始计数器数量为0
        assertEq(factory.getCountersCount(), 0);
    }

    /**
     * @dev 测试创建单个Counter合约
     */
    function test_CreateCounter() public {
        // 记录创建前的事件
        vm.recordLogs();
        
        // 创建Counter合约
        Counter counter = factory.createCounter();
        
        // 验证Counter合约地址不为空
        assertTrue(address(counter) != address(0));
        
        // 验证计数器数量增加到1
        assertEq(factory.getCountersCount(), 1);
        
        // 验证通过索引获取的合约地址是否匹配
        Counter retrievedCounter = factory.getCounter(0);
        assertEq(address(retrievedCounter), address(counter));
        
        // 验证Counter合约初始值为0
        assertEq(counter.x(), 0);
        
        // 检查事件是否正确触发
        Vm.Log[] memory entries = vm.getRecordedLogs();
        assertEq(entries.length, 1);
        
        // 解码事件数据
        bytes32 eventSignature = keccak256("CounterCreated(address,address)");
        assertEq(entries[0].topics[0], eventSignature);
        
        address createdCounterAddress = address(uint160(uint256(entries[0].topics[1])));
        address creatorAddress = address(uint160(uint256(entries[0].topics[2])));
        
        assertEq(createdCounterAddress, address(counter));
        assertEq(creatorAddress, owner);
    }

    /**
     * @dev 测试批量创建Counter合约
     */
    function test_CreateMultipleCounters() public {
        uint count = 3;
        
        // 批量创建Counter合约
        Counter[] memory counters = factory.createMultipleCounters(count);
        
        // 验证创建的合约数量
        assertEq(counters.length, count);
        assertEq(factory.getCountersCount(), count);
        
        // 验证每个创建的合约都不为空
        for (uint i = 0; i < count; i++) {
            assertTrue(address(counters[i]) != address(0));
            assertEq(address(factory.getCounter(i)), address(counters[i]));
        }
    }

    /**
     * @dev 测试Counter合约的功能
     */
    function test_CounterFunctionality() public {
        // 创建Counter合约
        Counter counter = factory.createCounter();
        
        // 测试inc()函数
        counter.inc();
        assertEq(counter.x(), 1);
        
        // 测试incBy()函数
        uint incrementAmount = 5;
        counter.incBy(incrementAmount);
        assertEq(counter.x(), 6);
        
        // 测试多次调用
        counter.inc();
        counter.incBy(2);
        assertEq(counter.x(), 9);
    }

    /**
     * @dev 测试错误处理 - 通过无效索引获取Counter
     */
    function testFuzz_GetCounterInvalidIndex(uint256 index) public {
        // 跳过有效的索引值（在这个测试中，工厂中没有创建任何计数器）
        vm.assume(index >= 0);
        
        // 验证调用失败并返回正确的错误信息
        vm.expectRevert("CounterFactory: Invalid index");
        factory.getCounter(index);
    }

    /**
     * @dev 测试错误处理 - 批量创建数量为0
     */
    function test_CreateMultipleCountersWithZero() public {
        vm.expectRevert("CounterFactory: Count must be greater than 0");
        factory.createMultipleCounters(0);
    }

    /**
     * @dev 测试多用户创建Counter合约
     */
    function test_MultiUserCreation() public {
        // 用户1创建一个Counter合约
        vm.prank(user1);
        Counter counter1 = factory.createCounter();
        
        // 用户2创建一个Counter合约
        vm.prank(user2);
        Counter counter2 = factory.createCounter();
        
        // 验证创建了两个合约
        assertEq(factory.getCountersCount(), 2);
        
        // 验证两个合约地址不同
        assertTrue(address(counter1) != address(counter2));
        
        // 验证通过索引可以正确获取两个合约
        assertEq(address(factory.getCounter(0)), address(counter1));
        assertEq(address(factory.getCounter(1)), address(counter2));
    }

    /**
     * @dev 测试Counter合约的incBy函数在传入0时的错误处理
     */
    function test_CounterIncByZeroReverts() public {
        // 创建Counter合约
        Counter counter = factory.createCounter();
        
        // 验证调用失败并返回正确的错误信息
        vm.expectRevert("incBy: increment should be positive");
        counter.incBy(0);
    }

    /**
     * @dev 模糊测试 - 测试不同数量的批量创建
     */
    function testFuzz_CreateMultipleCounters(uint8 count) public {
        // 只测试有效的count值（1-255）
        vm.assume(count > 0 && count <= 255);
        
        // 批量创建Counter合约
        Counter[] memory counters = factory.createMultipleCounters(count);
        
        // 验证创建的合约数量
        assertEq(counters.length, count);
        assertEq(factory.getCountersCount(), count);
        
        // 验证每个创建的合约都可以正常工作
        for (uint i = 0; i < count; i++) {
            Counter counter = factory.getCounter(i);
            counter.inc();
            assertEq(counter.x(), 1);
        }
    }
}