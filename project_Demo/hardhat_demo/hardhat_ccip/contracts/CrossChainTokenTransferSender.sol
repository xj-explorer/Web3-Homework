// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import "@chainlink/contracts-ccip/contracts/libraries/Client.sol";
import "@chainlink/contracts-ccip/contracts/interfaces/IRouterClient.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title CrossChainTokenTransferSender
 * @dev 用于发送ERC20 Token到其他链的CCIP跨链转账合约
 */
contract CrossChainTokenTransferSender {
    using SafeERC20 for IERC20;
    
    // CCIP路由器客户端接口
    IRouterClient private immutable i_routerClient;
    
    // 事件记录：当发送跨链Token时触发
    event TokensSent(
        bytes32 indexed messageId,         // 消息ID
        uint64 indexed destinationChainSelector, // 目标链选择器
        address receiver,                  // 目标链接收者地址
        address token,                     // Token地址
        uint256 tokenAmount,               // Token数量
        address feeToken,                  // 支付费用的Token地址
        uint256 fees                       // 支付的费用
    );

    /**
     * @dev 构造函数
     * @param router CCIP路由器地址
     */
    constructor(address router) {
        if (router == address(0)) revert InvalidRouter(address(0));
        i_routerClient = IRouterClient(router);
    }
    
    /**
     * @dev 发送ERC20 Token到目标链
     * @param destinationChainSelector 目标链的ChainSelector
     * @param receiver 目标链上的接收合约地址
     * @param token ERC20 Token地址
     * @param amount 发送数量
     * @return messageId 消息ID
     */
    function sendToken(
        uint64 destinationChainSelector,
        address receiver,
        address token,
        uint256 amount
    ) external returns (bytes32 messageId) {
        // 检查目标链是否支持
        if (!i_routerClient.isChainSupported(destinationChainSelector)) {
            revert UnsupportedDestinationChain(destinationChainSelector);
        }
        
        // 转移Token到本合约
        IERC20(token).safeTransferFrom(msg.sender, address(this), amount);
        
        // 授权给路由器使用Token
        SafeERC20.forceApprove(IERC20(token), address(i_routerClient), amount);
        
        // 构造CCIP消息
        Client.EVMTokenAmount[] memory tokenAmounts = new Client.EVMTokenAmount[](1);
        tokenAmounts[0] = Client.EVMTokenAmount({
            token: token,
            amount: amount
        });
        
        // 构造额外参数 - 设置gas limit
        Client.EVMExtraArgsV1 memory extraArgs = Client.EVMExtraArgsV1({
            gasLimit: 200000 // 设置适当的gas limit
        });
        
        Client.EVM2AnyMessage memory message = Client.EVM2AnyMessage({
            receiver: abi.encode(receiver),
            data: "",
            tokenAmounts: tokenAmounts,
            feeToken: address(0), // 使用原生代币支付费用
            extraArgs: Client._argsToBytes(extraArgs)
        });
        
        // 获取费用估算
        uint256 fee = i_routerClient.getFee(destinationChainSelector, message);
        
        // 发送跨链消息
        messageId = i_routerClient.ccipSend{value: fee}(destinationChainSelector, message);
        
        emit TokensSent(
            messageId,
            destinationChainSelector,
            receiver,
            token,
            amount,
            address(0),
            fee
        );
        
        return messageId;
    }
    
    // 错误定义
    error InvalidRouter(address router);
    error UnsupportedDestinationChain(uint64 chainSelector);
}