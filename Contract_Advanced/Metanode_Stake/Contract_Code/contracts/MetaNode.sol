// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MetaNodeToken is ERC20{
    constructor() ERC20("MetaNodeToken", "MetaNode"){
        // 铸造初始供应量
         _mint(msg.sender, 10000000*1_000_000_000_000_000_000);
    }
}