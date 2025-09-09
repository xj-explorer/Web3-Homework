// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title ETHReceiver
 * @dev 一个简单的合约，用于测试接收ETH时返回数据的情况
 */
contract ETHReceiver {
    /**
     * @dev 接收ETH的函数
     */
    receive() external payable {
        // 不返回任何值，因为Solidity的receive函数不能有返回值
    }
    
    /**
     * @dev 一个fallback函数，用于测试data.length > 0的情况
     */
    fallback() external payable {
        // 这个函数没有返回值，但调用它时会产生data
    }
}