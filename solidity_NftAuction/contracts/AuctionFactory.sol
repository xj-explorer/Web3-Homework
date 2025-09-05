// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./NFTAuction.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title AuctionFactory
 * @dev 拍卖工厂合约，负责创建和管理拍卖合约实例
 */
contract AuctionFactory is Ownable {
    // 存储创建的拍卖合约地址
    address[] public auctionContracts;
    // 映射：拍卖合约地址 -> 创建者
    mapping(address => address) public auctionCreators;

    // 事件定义
    event AuctionContractCreated(address indexed auctionContract, address indexed creator);

    // Chainlink价格预言机地址
    address public ethUsdPriceFeed;
    // 映射：代币地址 -> 该代币对应的USD价格预言机地址
    // 用于存储不同代币对应的Chainlink价格预言机地址，方便查询各代币与USD的价格
    mapping(address => address) public tokenUsdPriceFeeds;
    // 存储已设置价格预言机的代币地址列表
    address[] public supportedTokens;

    /**
     * @dev 构造函数，初始化工厂合约
     * @param _ethUsdPriceFeed ETH/USD价格预言机地址
     */
    constructor(address _ethUsdPriceFeed) Ownable(msg.sender) {
        ethUsdPriceFeed = _ethUsdPriceFeed;
    }

    /**
     * @dev 设置ETH/USD价格预言机
     * @param _ethUsdPriceFeed 新的ETH/USD价格预言机地址
     */
    function setEthUsdPriceFeed(address _ethUsdPriceFeed) external onlyOwner {
        ethUsdPriceFeed = _ethUsdPriceFeed;
    }

    /**
     * @dev 设置代币价格预言机
     * @param token 代币地址
     * @param priceFeed 价格预言机地址
     */
    function setTokenPriceFeed(address token, address priceFeed) external onlyOwner {
        // 检查是否是首次设置该代币的价格预言机
        if (tokenUsdPriceFeeds[token] == address(0) && priceFeed != address(0)) {
            // 首次设置且价格预言机地址不为0，将代币地址添加到supportedTokens数组
            supportedTokens.push(token);
        }
        // 更新或删除价格预言机地址
        tokenUsdPriceFeeds[token] = priceFeed;
    }

    /**
     * @dev 创建新的拍卖合约实例
     * @return auctionContract 新创建的拍卖合约地址
     */
    function createAuctionContract() external returns (address) {
        // 创建新的拍卖合约实例
        NFTAuction auctionContract = new NFTAuction(ethUsdPriceFeed);
        address auctionContractAddress = address(auctionContract);
        
        // 存储拍卖合约信息
        auctionContracts.push(auctionContractAddress);
        auctionCreators[auctionContractAddress] = msg.sender;
        
        // 为新创建的拍卖合约设置代币价格预言机
        for (uint256 i = 0; i < supportedTokens.length; i++) {
            address token = supportedTokens[i];
            if (tokenUsdPriceFeeds[token] != address(0)) {
                auctionContract.setTokenPriceFeed(token, tokenUsdPriceFeeds[token]);
            }
        }
        
        emit AuctionContractCreated(auctionContractAddress, msg.sender);
        return auctionContractAddress;
    }

    /**
     * @dev 获取所有创建的拍卖合约数量
     * @return count 拍卖合约数量
     */
    function getAuctionContractCount() external view returns (uint256) {
        return auctionContracts.length;
    }

    /**
     * @dev 获取所有创建的拍卖合约地址
     * @return contracts 拍卖合约地址数组
     */
    function getAllAuctionContracts() external view returns (address[] memory) {
        return auctionContracts;
    }

    /**
     * @dev 验证某个地址是否是拍卖合约的创建者
     * @param auctionContract 拍卖合约地址
     * @param creator 待验证的创建者地址
     * @return isCreator 是否是创建者
     */
    function isAuctionCreator(address auctionContract, address creator) external view returns (bool) {
        return auctionCreators[auctionContract] == creator;
    }
}