// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./Counter.sol";

/**
 * @title CounterFactory
 * @dev 工厂合约，用于创建和管理Counter合约实例
 * 使用工厂模式来集中管理多个Counter合约实例
 */
contract CounterFactory {
    // 存储所有创建的Counter合约地址
    Counter[] public counters;
    
    // 记录合约创建事件
    event CounterCreated(address indexed counterAddress, address indexed creator);
    
    /**
     * @dev 创建一个新的Counter合约实例
     * @return 新创建的Counter合约地址
     */
    function createCounter() public returns (Counter) {
        // 创建新的Counter合约实例
        Counter newCounter = new Counter();
        
        // 将新创建的合约地址添加到数组中
        counters.push(newCounter);
        
        // 触发创建事件
        emit CounterCreated(address(newCounter), msg.sender);
        
        return newCounter;
    }
    
    /**
     * @dev 获取创建的Counter合约总数
     * @return 已创建的Counter合约数量
     */
    function getCountersCount() external view returns (uint) {
        return counters.length;
    }
    
    /**
     * @dev 根据索引获取Counter合约地址
     * @param index 合约索引
     * @return 指定索引的Counter合约地址
     */
    function getCounter(uint index) external view returns (Counter) {
        require(index < counters.length, "CounterFactory: Invalid index");
        return counters[index];
    }
    
    /**
     * @dev 批量创建多个Counter合约
     * @param count 要创建的合约数量
     * @return 创建的合约地址数组
     */
    function createMultipleCounters(uint count) external returns (Counter[] memory) {
        require(count > 0, "CounterFactory: Count must be greater than 0");
        
        Counter[] memory newCounters = new Counter[](count);
        
        for (uint i = 0; i < count; i++) {
            Counter counter = createCounter();
            newCounters[i] = counter;
        }
        
        return newCounters;
    }
}