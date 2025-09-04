// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import '@chainlink/contracts/src/v0.8/shared/interfaces/AggregatorV3Interface.sol';

/**
 * @title PriceConsumer合约
 * @dev 该合约通过Chainlink预言机获取实时ETH价格，并实现价格阈值触发功能
 */
contract PriceConsumer {
    // 定义价格更新事件，当获取到最新价格时触发
    // @param price: 最新获取的ETH价格（单位：USD，8位小数）
    // @param timestamp: 获取价格时的时间戳
    event PriceUpdated(uint256 price, uint256 timestamp);

    // 定义价格阈值设置事件，当设置新的价格阈值时触发
    // @param threshold: 新设置的价格阈值（单位：USD，8位小数）
    event PriceThresholdSet(uint256 threshold);

    // 定义价格超过阈值事件，当当前价格超过预设阈值时触发
    // @param currentPrice: 当前获取的ETH价格（单位：USD，8位小数）
    // @param threshold: 当前设置的价格阈值（单位：USD，8位小数）
    event PriceThresholdExceeded(uint256 currentPrice, uint256 threshold);

    // 定义价格低于阈值事件，当当前价格低于预设阈值时触发
    // @param currentPrice: 当前获取的ETH价格（单位：USD，8位小数）
    // @param threshold: 当前设置的价格阈值（单位：USD，8位小数）
    event PriceThresholdBelow(uint256 currentPrice, uint256 threshold);

    // Chainlink价格Feed接口
    AggregatorV3Interface internal immutable priceFeed;

    // 价格阈值状态变量
    uint256 public priceThreshold;
    // 最后获取的价格
    uint256 public lastPrice;
    // 最后获取价格的时间戳
    uint256 public lastPriceTimestamp;

    /**
     * @dev 构造函数
     * @param priceFeedAddress Chainlink价格Feed合约地址
     */
    constructor(address priceFeedAddress) {
        // 在Sepolia测试网上，ETH/USD的价格Feed地址为：0x694AA1769357215DE4FAC081bf1f309aDC325306
        priceFeed = AggregatorV3Interface(priceFeedAddress);
    }

    /**
     * @dev 获取最新的ETH价格
     * @return 最新的ETH价格（单位：USD，8位小数）
     */
    function getLatestPrice() public returns (uint256) {
        // 调用Chainlink价格Feed合约的latestRoundData函数
        (
        ,
        int256 price,
        ,
        uint256 timestamp,
        ) = priceFeed.latestRoundData();

        // 检查价格是否有效
        require(price > 0, 'Invalid price');
        require(timestamp > 0, 'Invalid timestamp');

        // 更新状态变量
        lastPrice = uint256(price);
        lastPriceTimestamp = timestamp;

        // 触发价格更新事件
        emit PriceUpdated(lastPrice, lastPriceTimestamp);

        // 检查是否触发价格阈值
        checkPriceThreshold();

        return lastPrice;
    }

    /**
     * @dev 设置价格阈值，可在合约部署后任意时间调用此函数设置或更新价格阈值
     * @param _threshold 价格阈值（单位：USD，8位小数）
     */
    function setPriceThreshold(uint256 _threshold) public {
        priceThreshold = _threshold;
        emit PriceThresholdSet(_threshold);
    }

    /**
     * @dev 检查当前价格是否超过阈值
     */
    function checkPriceThreshold() public {
        // 确保已设置阈值且已有价格数据
        require(priceThreshold > 0, 'Threshold not set');
        require(lastPrice > 0, 'No price data available');

        // 检查价格是否超过阈值
        if (lastPrice > priceThreshold) {
            emit PriceThresholdExceeded(lastPrice, priceThreshold);
        } else if (lastPrice < priceThreshold) {
            emit PriceThresholdBelow(lastPrice, priceThreshold);
        }
    }

    /**
     * @dev 获取Chainlink价格Feed的小数位数
     * @return 小数位数
     */
    function getDecimals() public view returns (uint8) {
        return priceFeed.decimals();
    }

    /**
     * @dev 获取Chainlink价格Feed的描述
     * @return 价格Feed描述
     */
    function getDescription() public view returns (string memory) {
        return priceFeed.description();
    }

    /**
     * @dev 获取最新的完整价格数据
     * @return roundId 回合ID
     * @return price 价格
     * @return startedAt 开始时间
     * @return updatedAt 更新时间
     * @return answeredInRound 回答的回合
     */
    function getLatestRoundData() public view returns (
        uint80 roundId,
        int256 price,
        uint256 startedAt,
        uint256 updatedAt,
        uint80 answeredInRound
    ) {
        return priceFeed.latestRoundData();
    }
}