pragma solidity ^0.8.13;

/**
 * 优化版Counter合约 - 应用了多种Gas优化策略
 */
contract CounterOptimized {
    // 优化1: 使用更紧凑的数据类型(uint64)代替uint256
    // 假设计数器的值不会超过18,446,744,073,709,551,615
    uint64 public number; // 使用uint64替代uint256，减少存储占用

    // 优化2: 事件优化 - 简化事件结构，减少日志数据量
    event Changed(uint64 indexed newValue); // 使用indexed参数，且只记录新值

    // 优化3: 构造函数优化 - 直接赋值，简化逻辑
    constructor(uint64 initialNumber) {
        number = initialNumber;
        emit Changed(initialNumber);
    }

    // 优化4: 内联汇编优化 - 对于简单的set操作，可以使用内联汇编进一步优化
    function setNumber(uint64 newNumber) public {
        assembly {
            // 直接存储新值到number变量的位置
            sstore(number.slot, newNumber)
        }
        emit Changed(newNumber);
    }

    // 优化5: 函数实现优化 - 简化increment函数，减少操作步骤
    function increment() public {
        assembly {
            // 直接读取当前值，加1，然后存储回去
            let current := sload(number.slot)
            let next := add(current, 1)
            sstore(number.slot, next)
        }
        emit Changed(number); // 使用标准emit语句触发事件
    }

    // 优化6: 批量操作优化 - add函数已经是批量操作，但可以进一步优化
    function add(uint64 value) public {
        assembly {
            let current := sload(number.slot)
            let next := add(current, value)
            sstore(number.slot, next)
        }
        emit Changed(number); // 使用标准emit语句触发事件
    }

    // 优化7: 短路逻辑优化 - 在decrement函数中使用短路逻辑
    function decrement() public {
        // 使用require确保不会减到负数以下
        require(number > 0, "Counter: cannot decrement below zero");
        assembly {
            let current := sload(number.slot)
            let next := sub(current, 1)
            sstore(number.slot, next)
        }
        emit Changed(number); // 使用标准emit语句触发事件
    }

    // 优化8: 避免重复计算 - subtract函数优化
    function subtract(uint64 value) public {
        // 使用require确保不会减到负数以下
        require(number >= value, "Counter: cannot subtract below zero");
        assembly {
            let current := sload(number.slot)
            let next := sub(current, value)
            sstore(number.slot, next)
        }
        emit Changed(number); // 使用标准emit语句触发事件
    }

    // 优化9: multiply函数优化
    function multiply(uint64 value) public {
        assembly {
            let current := sload(number.slot)
            let next := mul(current, value)
            sstore(number.slot, next)
        }
        emit Changed(number); // 使用标准emit语句触发事件
    }

    // 优化10: reset函数优化 - 直接设为0，使用内联汇编进一步减少Gas消耗
    function reset() public {
        assembly {
            sstore(number.slot, 0) // 直接将存储位置设为0
        }
        emit Changed(0); // 使用标准emit语句触发事件
    }
}