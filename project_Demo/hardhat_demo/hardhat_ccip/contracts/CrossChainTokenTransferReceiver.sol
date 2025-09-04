// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import "@chainlink/contracts-ccip/contracts/applications/CCIPReceiver.sol";
import "@chainlink/contracts-ccip/contracts/libraries/Client.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title CrossChainTokenTransferReceiver
 * @dev 用于接收来自其他链的CCIP跨链Token转账
 */
contract CrossChainTokenTransferReceiver is CCIPReceiver {
    using SafeERC20 for IERC20;
    
    // 事件记录：当接收到跨链Token时触发
    event TokensReceived(
        bytes32 indexed messageId,       // 消息ID
        uint64 indexed sourceChainSelector, // 源链选择器
        address sender,                  // 发送者地址
        address token,                   // Token地址
        uint256 tokenAmount              // Token数量
    );

    /**
     * @dev 构造函数
     * @param router CCIP路由器地址
     */
    constructor(address router) CCIPReceiver(router) {}
    
    /**
     * @dev 接收来自源链的Token的内部实现
     * @param message CCIP消息
     */
    function _ccipReceive(
        Client.Any2EVMMessage memory message
    ) internal override {
        // 解析消息发送者地址
        address sender = abi.decode(message.sender, (address));
        uint64 sourceChainSelector = message.sourceChainSelector;
        
        // 处理接收到的Token
        for (uint256 i = 0; i < message.destTokenAmounts.length; i++) {
            Client.EVMTokenAmount memory tokenAmount = message.destTokenAmounts[i];
            
            // 将Token转给消息中指定的接收者
            IERC20(tokenAmount.token).safeTransfer(
                address(this), // 先转到本合约
                tokenAmount.amount
            );
            
            emit TokensReceived(
                message.messageId,
                sourceChainSelector,
                sender,
                tokenAmount.token,
                tokenAmount.amount
            );
        }
    }
}