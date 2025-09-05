// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./Auction.sol";

contract AuctionV2 is Auction {
    // 新增版本号函数
    function version() public pure returns (string memory) {
        return "V2";
    }

        // 初始化V2版本的额外状态变量
    // 初始化V2版本的额外状态变量
    // 初始化V2版本的额外状态变量
    // 供工厂合约调用的V2初始化函数
    function factoryInitializeV2(address factory) external {
        // 确保只有工厂合约可以调用
        require(msg.sender == factory, "Only factory can call this function");
        // 确保这个函数只能被调用一次
        require(minBidIncrementPercentage == 0, "V2 already initialized");
        minBidIncrementPercentage = 50; // 默认5%
    }

    // 保留原有的onlyOwner初始化函数，供直接升级使用
    function initializeV2() public onlyOwner {
        // 确保这个函数只能被调用一次
        require(minBidIncrementPercentage == 0, "V2 already initialized");
        minBidIncrementPercentage = 50; // 默认5%
    }

    // 新增功能：设置最小竞拍增量
    uint256 public minBidIncrementPercentage; // 默认5%

    function setMinBidIncrementPercentage(uint256 _minBidIncrementPercentage) external onlyOwner {
        require(_minBidIncrementPercentage <= 1000, "Increment too high"); // 最大10%
        minBidIncrementPercentage = _minBidIncrementPercentage;
    }

    // 重写竞拍函数，添加最小竞拍增量检查
    function placeBid(uint256 auctionId) external payable override {
        AuctionInfo storage auction = auctions[auctionId];
        require(auction.status == AuctionStatus.Active, "Auction not active");
        require(block.timestamp < auction.endTime, "Auction ended");

        uint256 bidAmount;
        if (auction.paymentToken == address(0)) {
            // ETH出价
            bidAmount = msg.value;
        } else {
            // ERC20代币出价
            require(msg.value == 0, "Cannot send ETH for ERC20 auction");
            bidAmount = IERC20(auction.paymentToken).allowance(msg.sender, address(this));
        }

        require(bidAmount > auction.currentPrice, "Bid too low");

        // 检查最小竞拍增量
        uint256 minIncrement = (auction.currentPrice * minBidIncrementPercentage) / 10000;
        require(bidAmount >= auction.currentPrice + minIncrement, "Bid increment too low");

        // 退还之前竞拍者的资金
        if (auction.currentWinner != address(0)) {
            if (auction.paymentToken == address(0)) {
                //  ETH支付
                payable(auction.currentWinner).transfer(auction.currentPrice);
            } else {
                // ERC20支付
                IERC20(auction.paymentToken).transfer(auction.currentWinner, auction.currentPrice);
            }
        }

        // 更新竞拍信息
        auction.currentPrice = bidAmount;
        auction.currentWinner = msg.sender;

        // 转移资金到合约
        if (auction.paymentToken != address(0)) {
            // ERC20支付
            IERC20(auction.paymentToken).transferFrom(msg.sender, address(this), bidAmount);
        }

        emit BidPlaced(auctionId, msg.sender, bidAmount);
    }
}

// 注意：AuctionV2合约继承自Auction，需要在部署时提供initialOwner参数
// 对于UUPS升级，通常通过代理合约调用initialize函数来初始化，而不是直接调用构造函数