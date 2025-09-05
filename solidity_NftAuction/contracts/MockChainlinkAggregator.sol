// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title MockChainlinkAggregator
 * @dev Chainlink价格预言机的模拟合约，用于测试
 */
contract MockChainlinkAggregator {
    int256 private _answer;
    uint80 private _roundId;
    uint256 private _updatedAt;
    
    /**
     * @dev 构造函数，设置初始价格
     * @param answer 初始价格值
     */
    constructor(int256 answer) {
        _answer = answer;
        _roundId = 1;
        _updatedAt = block.timestamp;
    }
    
    /**
     * @dev 获取小数位数
     * @return 小数位数（默认8位）
     */
    function decimals() external pure returns (uint8) {
        return 8;
    }
    
    /**
     * @dev 获取描述信息
     * @return 描述字符串
     */
    function description() external pure returns (string memory) {
        return "Mock ETH/USD Price Feed";
    }
    
    /**
     * @dev 获取版本号
     * @return 版本号
     */
    function version() external pure returns (uint256) {
        return 1;
    }
    
    /**
     * 获取指定轮次的数据
     * @param _roundIdParam 轮次ID
     * @return roundId 轮次ID
     * @return answer 价格数据
     * @return startedAt 开始时间
     * @return updatedAt 更新时间
     * @return answeredInRound 回答轮次
     */
    function getRoundData(uint80 _roundIdParam) external view returns (
        uint80 roundId,
        int256 answer,
        uint256 startedAt,
        uint256 updatedAt,
        uint80 answeredInRound
    ) {
        return (
            _roundId,
            _answer,
            _updatedAt,
            _updatedAt,
            _roundId
        );
    }
    
    /**
     * 获取最新轮次的数据
     * @return roundId 轮次ID
     * @return answer 价格数据
     * @return startedAt 开始时间
     * @return updatedAt 更新时间
     * @return answeredInRound 回答轮次
     */
    function latestRoundData() external view returns (
        uint80 roundId,
        int256 answer,
        uint256 startedAt,
        uint256 updatedAt,
        uint80 answeredInRound
    ) {
        return (
            _roundId,
            _answer,
            _updatedAt,
            _updatedAt,
            _roundId
        );
    }
    
    /**
     * @dev 获取最新价格
     * @return 最新价格
     */
    function latestAnswer() external view returns (int256) {
        return _answer;
    }
    
    /**
     * @dev 设置新的价格（仅用于测试）
     * @param newAnswer 新的价格值
     */
    function setAnswer(int256 newAnswer) external {
        _answer = newAnswer;
        _updatedAt = block.timestamp;
        _roundId++;
    }
}