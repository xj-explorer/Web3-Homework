// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title AuctionToken
 * @dev 实现一个ERC20代币，用于NFT拍卖的竞价
 */
contract AuctionToken is ERC20, Ownable {
    /**
     * @dev 构造函数，初始化代币的名称、符号和初始供应量
     * @param initialSupply 初始供应量（不包含小数位）
     */
    constructor(uint256 initialSupply) ERC20("AuctionToken", "ATK") Ownable(msg.sender) {
        _mint(msg.sender, initialSupply * 10 ** decimals());
    }

    /**
     * @dev 增发代币
     * @param to 接收代币的地址
     * @param amount 增发的代币数量（包含小数位）
     */
    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }
}