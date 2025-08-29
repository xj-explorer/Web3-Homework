// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

contract CounterUpgradeable is Initializable, UUPSUpgradeable, OwnableUpgradeable {
    // 存储计数值，使用internal可见性，以便子合约可以访问
    uint256 internal count;

    // 事件，当计数改变时触发
    event CountChanged(string action, uint256 newCount);

    // 防止直接初始化合约
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        // 禁用构造函数中的初始化器，防止通过构造函数意外初始化合约。
        // 对于可升级合约，初始化逻辑应该在 initialize 函数中完成，而不是构造函数，
        // 此方法确保合约只能通过 initialize 函数进行初始化，增强合约升级的安全性。
        // _disableInitializers 函数引用自 @openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol
        _disableInitializers();
    }

    // 初始化函数，代替构造函数
    function initialize() public initializer {
        // 初始化 Ownable 合约的未链接版本，将调用者设置为合约拥有者owner。
        // _msgSender() 函数会返回当前调用者的地址，此操作确保只有初始化时指定的地址拥有合约所有权。
        // __Ownable_init_unchained 函数引用自 @openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol
        __Ownable_init_unchained(_msgSender());
        // 初始化 UUPS 升级机制，为合约启用 UUPS 可升级功能。
        // 该函数会设置必要的状态变量，确保合约可以通过 UUPS 模式进行升级操作。
        // __UUPSUpgradeable_init 函数引用自 @openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol
        __UUPSUpgradeable_init();
        // 将计数器初始值设置为 0，保证合约开始时计数处于初始状态。
        count = 0;
    }

    // 升级权限控制函数
    // 该函数是UUPS可升级模式中的核心安全机制，负责验证升级操作的合法性
    // 在UUPS模式下，升级逻辑定义在实现合约中，每次升级都会调用此函数进行权限验证
    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {
        // 权限控制机制详解：
        // 1. onlyOwner修饰符（从OwnableUpgradeable继承）确保只有合约拥有者才能调用此函数
        // 2. 合约拥有者通常使用OpenZeppelin的升级插件（如Hardhat的@openzeppelin/hardhat-upgrades）来发起升级交易。
        // 3. 当使用Hardhat升级插件时，插件会从环境变量中读取账户信息，如果该账户是合约拥有者，
        // 4. 插件将使用此账户与代理合约交互，代理合约的fallback函数会触发调用此验证函数
        // 5. 当此函数验证通过后，代理合约的实现地址才会被更新为newImplementation
        
        // 安全验证：确保新实现合约地址不为零地址
        require(newImplementation != address(0), "New implementation address cannot be zero");
        
        // 权限控制流程：
        // - 调用者（msg.sender）尝试升级合约
        // - onlyOwner修饰符检查调用者是否为合约拥有者(owner())
        // - 如果不是合约拥有者，会在onlyOwner修饰符中触发revert
        // - 如果是合约拥有者，则继续执行后续验证逻辑
        // - 验证新实现合约地址有效后，函数成功执行，允许升级操作继续
        
        // 注意：UUPS模式中，升级的实际执行由代理合约的fallback函数触发
        // 此函数仅负责权限验证，不直接执行升级操作
    }

    // 获取当前计数
    function getCount() public view returns (uint256) {
        return count;
    }

    // 增加计数，标记为virtual以便子合约可以重写
    function increment() public virtual {
        count += 1;
        emit CountChanged("increment", count);
    }

    // 减少计数
    function decrement() public {
        require(count > 0, "Count cannot be negative");
        count -= 1;
        emit CountChanged("decrement", count);
    }

    // 重置计数为0，标记为virtual以便子合约可以重写
    function reset() public virtual {
        require(count > 0, "Count must be greater than 0");
        count = 0;
        emit CountChanged("reset", count);
    }

    // 为了确保合约升级安全，添加存储间隙
    // Storage gap for future upgrades
    uint256[50] private __gap;
}