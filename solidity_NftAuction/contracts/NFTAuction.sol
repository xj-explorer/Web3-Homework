// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC721/utils/ERC721Holder.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@chainlink/contracts/src/v0.8/shared/interfaces/AggregatorV3Interface.sol";

/**
 * @title NFTAuction
 * @dev NFT拍卖合约，支持ERC721代币的拍卖功能，并集成Chainlink预言机获取价格信息
 */
contract NFTAuction is ReentrancyGuard, ERC721Holder {
    // 拍卖结构体，存储拍卖的详细信息
    struct Auction {
        address seller;         // 卖家地址
        address nftContract;    // NFT合约地址
        uint256 tokenId;        // NFT的ID
        uint256 startTime;      // 拍卖开始时间
        uint256 endTime;        // 拍卖结束时间
        uint256 startingBid;    // 起拍价
        uint256 highestBid;     // 当前最高价
        address highestBidder;  // 当前最高出价者
        address bidToken;       // 出价使用的代币地址(0表示ETH)
        bool ended;             // 拍卖是否已结束
    }

    // 存储所有拍卖信息的映射
    mapping(uint256 => Auction) public auctions;
    uint256 public nextAuctionId;  // 下一个拍卖的ID

    // Chainlink价格预言机接口
    AggregatorV3Interface public ethUsdPriceFeed;
    mapping(address => AggregatorV3Interface) public tokenUsdPriceFeeds;

    // 事件定义
    // 当新拍卖创建时触发的事件
    event AuctionCreated(uint256 indexed auctionId, address indexed seller, address indexed nftContract, uint256 tokenId);
    // 当有新出价时触发的事件
    event BidPlaced(uint256 indexed auctionId, address indexed bidder, uint256 amount);
    // 当拍卖结束时触发的事件
    event AuctionEnded(uint256 indexed auctionId, address indexed winner, uint256 amount);
    // 当之前的最高出价被退回时触发的事件
    event BidWithdrawn(uint256 indexed auctionId, address indexed bidder, uint256 amount);
    // 当设置代币价格预言机时触发的事件
    event PriceFeedSet(address indexed token, address indexed priceFeed);

    /**
     * @dev 构造函数，初始化合约并设置ETH/USD价格预言机
     * @param _ethUsdPriceFeed ETH/USD价格预言机地址
     */
    constructor(address _ethUsdPriceFeed) {
        ethUsdPriceFeed = AggregatorV3Interface(_ethUsdPriceFeed);
        nextAuctionId = 0;
    }

    /**
     * @dev 设置代币价格预言机
     * @param token 代币地址
     * @param priceFeed 价格预言机地址
     */
    function setTokenPriceFeed(address token, address priceFeed) external {
        tokenUsdPriceFeeds[token] = AggregatorV3Interface(priceFeed);
        emit PriceFeedSet(token, priceFeed);
    }

    /**
     * @dev 获取最新的价格数据
     * @param priceFeed 价格预言机接口，本质上是实现了AggregatorV3Interface接口的合约
     * @return price 最新价格（USD）
     */
    function getLatestPrice(AggregatorV3Interface priceFeed) internal view returns (uint256) {
        (, int256 price, , , ) = priceFeed.latestRoundData();
        // 价格预言机返回的数据有8位小数
        return uint256(price) * 10 ** 10; // 转换为18位小数
    }

    /**
     * @dev 将代币金额转换为美元价值
     * @param amount 代币数量
     * @param token 代币地址（0表示ETH）
     * @return usdValue 美元价值
     */
    function convertToUsd(uint256 amount, address token) public view returns (uint256) {
        if (token == address(0)) {
            // ETH转换为USD
            uint256 ethPrice = getLatestPrice(ethUsdPriceFeed);
            return (amount * ethPrice) / 10 ** 18;
        } else {
            // ERC20代币转换为USD
            // 从映射中获取该代币对应的价格预言机接口
            AggregatorV3Interface priceFeed = tokenUsdPriceFeeds[token];
            // 检查是否已为该代币设置价格预言机，若未设置则抛出错误
            require(address(priceFeed) != address(0), "Price feed not available for this token");
            // 调用getLatestPrice函数获取该代币的最新价格（USD，18位小数）
            uint256 tokenPrice = getLatestPrice(priceFeed);
            // 将代币数量乘以代币价格，再除以10^18，得到该代币数量对应的美元价值
            return (amount * tokenPrice) / 10 ** 18;
        }
    }

    /**
     * @dev 创建新的拍卖
     * @param nftContract NFT合约地址
     * @param tokenId NFT的ID
     * @param startingBid 起拍价
     * @param duration 拍卖持续时间（秒）
     * @param bidToken 出价使用的代币地址（0表示ETH）
     */
    function createAuction(
        address nftContract,
        uint256 tokenId,
        uint256 startingBid,
        uint256 duration,
        address bidToken
    ) external {
        require(duration > 0, "Duration must be greater than 0");
        require(startingBid > 0, "Starting bid must be greater than 0");

        // 检查NFT所有权并转移到合约
        IERC721 nft = IERC721(nftContract);
        // 检查调用者是否为该NFT的所有者，若不是则抛出错误
        require(nft.ownerOf(tokenId) == msg.sender, "You don't own this NFT");
        // 检查合约是否已被授权操作该NFT。授权方式有两种：
        // 1. 调用者将合约设置为所有NFT的操作员（isApprovedForAll返回true）
        // 2. 调用者单独批准该特定ID的NFT给合约（getApproved返回合约地址）
        // 若两种授权方式都不满足，则抛出错误
        require(nft.isApprovedForAll(msg.sender, address(this)) || nft.getApproved(tokenId) == address(this), "Contract not approved");

        uint256 auctionId = nextAuctionId;
        nextAuctionId++;

        auctions[auctionId] = Auction({
            seller: msg.sender,
            nftContract: nftContract,
            tokenId: tokenId,
            startTime: block.timestamp,
            endTime: block.timestamp + duration,
            startingBid: startingBid,
            highestBid: 0,
            highestBidder: address(0),
            bidToken: bidToken,
            ended: false
        });

        // 转移NFT到合约
        nft.safeTransferFrom(msg.sender, address(this), tokenId);

        emit AuctionCreated(auctionId, msg.sender, nftContract, tokenId);
    }

    /**
     * @dev 对拍卖进行出价
     * @param auctionId 拍卖的ID
     * @param bidAmount 指定的出价金额
     */
    function placeBid(uint256 auctionId, uint256 bidAmount) external payable nonReentrant {
        Auction storage auction = auctions[auctionId];
        require(block.timestamp < auction.endTime, "Auction has ended");
        require(!auction.ended, "Auction is already ended");

        if (auction.bidToken == address(0)) {
            // 使用ETH出价
            require(msg.value == bidAmount, "ETH amount mismatch");
        } else {
            // 使用ERC20代币出价
            IERC20 token = IERC20(auction.bidToken);
            require(token.balanceOf(msg.sender) >= bidAmount, "Insufficient token balance");
            require(token.allowance(msg.sender, address(this)) >= bidAmount, "Token not approved");
            token.transferFrom(msg.sender, address(this), bidAmount);
        }

        require(bidAmount > auction.highestBid && bidAmount >= auction.startingBid, "Bid too low");

        // 退还之前最高出价者的资金
        if (auction.highestBidder != address(0)) {
            _refund(auctionId);
        }

        // 更新最高出价信息
        auction.highestBid = bidAmount;
        auction.highestBidder = msg.sender;

        emit BidPlaced(auctionId, msg.sender, bidAmount);
    }

    /**
     * @dev 结束拍卖并分配NFT和资金
     * @param auctionId 拍卖的ID
     */
    function endAuction(uint256 auctionId) external nonReentrant {
        Auction storage auction = auctions[auctionId];
        require(block.timestamp >= auction.endTime, "Auction not yet ended");
        require(!auction.ended, "Auction is already ended");

        auction.ended = true;

        // 如果有最高出价者，转移NFT和资金
        if (auction.highestBidder != address(0)) {
            // 转移NFT给最高出价者
            IERC721(auction.nftContract).safeTransferFrom(address(this), auction.highestBidder, auction.tokenId);

            // 转移资金给卖家
            if (auction.bidToken == address(0)) {
                // 转移ETH
                payable(auction.seller).transfer(auction.highestBid);
            } else {
                // 转移ERC20代币
                IERC20(auction.bidToken).transfer(auction.seller, auction.highestBid);
            }

            emit AuctionEnded(auctionId, auction.highestBidder, auction.highestBid);
        } else {
            // 如果没有出价，将NFT退回给卖家
            IERC721(auction.nftContract).safeTransferFrom(address(this), auction.seller, auction.tokenId);
        }
    }

    /**
     * @dev 退还之前最高出价者的资金（内部函数）
     * @param auctionId 拍卖的ID
     */
    function _refund(uint256 auctionId) internal {
        Auction storage auction = auctions[auctionId];
        if (auction.bidToken == address(0)) {
            // 退还ETH
            payable(auction.highestBidder).transfer(auction.highestBid);
        } else {
            // 退还ERC20代币
            IERC20(auction.bidToken).transfer(auction.highestBidder, auction.highestBid);
        }
        emit BidWithdrawn(auctionId, auction.highestBidder, auction.highestBid);
    }

    // 防止合约接收ETH（除非通过placeBid函数）
    receive() external payable {
        revert("Direct ETH transfers not allowed");
    }
}