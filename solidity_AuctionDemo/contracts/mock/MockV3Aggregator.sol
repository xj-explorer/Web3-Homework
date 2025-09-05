// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import '@chainlink/contracts/src/v0.8/shared/interfaces/AggregatorV3Interface.sol';

contract MockV3Aggregator is AggregatorV3Interface {
  uint256 public constant override version = 0;

  uint8 private _decimals;
  int256 private _latestAnswer;
  uint256 private _latestTimestamp;
  uint256 private _latestRound;

  constructor(uint8 decimals, int256 initialAnswer) {
    _decimals = decimals;
    _latestAnswer = initialAnswer;
    _latestTimestamp = block.timestamp;
    _latestRound = 1;
  }

  function decimals() external view override returns (uint8) {
    return _decimals;
  }

  function description() external pure override returns (string memory) {
    return 'MockV3Aggregator';
  }

  function getRoundData(uint80) external view override
    returns (
      uint80 roundId,
      int256 answer,
      uint256 startedAt,
      uint256 updatedAt,
      uint80 answeredInRound
    )
  {
    return (
      uint80(_latestRound),
      _latestAnswer,
      _latestTimestamp,
      _latestTimestamp,
      uint80(_latestRound)
    );
  }

  function latestRoundData() external view override
    returns (
      uint80 roundId,
      int256 answer,
      uint256 startedAt,
      uint256 updatedAt,
      uint80 answeredInRound
    )
  {
    return (
      uint80(_latestRound),
      _latestAnswer,
      _latestTimestamp,
      _latestTimestamp,
      uint80(_latestRound)
    );
  }

  // 允许设置新的价格
  function setAnswer(int256 answer) external {
    _latestAnswer = answer;
    _latestTimestamp = block.timestamp;
    _latestRound++;
  }

  // 允许设置特定轮次的数据
  function setRoundData(
    uint80 roundId,
    int256 answer,
    uint256 timestamp,
    uint256 answeredInRound
  ) external {
    _latestRound = roundId;
    _latestAnswer = answer;
    _latestTimestamp = timestamp;
  }
}