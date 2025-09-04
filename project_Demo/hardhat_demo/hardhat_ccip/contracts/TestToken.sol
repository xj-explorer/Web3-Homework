// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title TestToken
 * @dev 一个简单的ERC20代币合约，用于测试CCIP跨链转账功能
 * 该合约支持铸造功能，便于测试过程中获取测试代币
 */
contract TestToken is ERC20, Ownable {
    /**
     * @dev 构造函数
     * @param name 代币名称
     * @param symbol 代币符号
     * @param initialSupply 初始供应量（以wei为单位）
     */
    constructor(
        string memory name,
        string memory symbol,
        uint256 initialSupply
    ) ERC20(name, symbol) Ownable(_msgSender()) {
        // 向部署者铸造初始供应量的代币
        _mint(_msgSender(), initialSupply);
    }

    /**
     * @dev 铸造新的代币
     * 只有合约所有者可以调用此函数
     * @param to 接收者地址
     * @param amount 铸造的代币数量（以wei为单位）
     */
    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }

    /**
     * @dev 批量铸造代币给多个地址
     * 只有合约所有者可以调用此函数
     * @param recipients 接收者地址数组
     * @param amounts 每个接收者对应的代币数量数组
     */
    function batchMint(address[] calldata recipients, uint256[] calldata amounts) external onlyOwner {
        require(recipients.length == amounts.length, "TestToken: recipients and amounts length mismatch");
        
        for (uint256 i = 0; i < recipients.length; i++) {
            _mint(recipients[i], amounts[i]);
        }
    }

    /**
     * @dev 销毁代币
     * 任何人都可以销毁自己持有的代币
     * @param amount 销毁的代币数量（以wei为单位）
     */
    function burn(uint256 amount) external {
        _burn(_msgSender(), amount);
    }
}