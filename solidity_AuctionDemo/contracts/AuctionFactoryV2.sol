// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./AuctionFactory.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

contract AuctionFactoryV2 is AuctionFactory {    
    // 初始化函数，调用父合约的初始化
    function initialize(address _auctionImplementation) external override initializer {        
        __Ownable_init(msg.sender);
        __UUPSUpgradeable_init();
        auctionImplementation = _auctionImplementation;
        nextAuctionId = 0;
        auctionVersion = 1;
    }
    // 版本号函数
    function version() external pure returns (string memory) {
        return "V2";
    }

    // 简单的helloworld函数
    function helloworld() external pure returns (string memory) {
        return "Hello, World! This is AuctionFactoryV2.";
    }

    // V2版本特定的初始化函数
    function initializeV2() external reinitializer(2) onlyOwner {
        // 此处可以添加V2版本的初始化逻辑
        // 由于需求中不需要添加其他逻辑，所以留空
    }
}