// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@chainlink/contracts/src/v0.8/shared/interfaces/AggregatorV3Interface.sol";

contract Auction is Initializable, UUPSUpgradeable, OwnableUpgradeable {

    // 拍卖状态
    enum AuctionStatus {
        Active,
        Ended,
        Cancelled
    }

    // 拍卖结构体
    struct AuctionInfo {
        address seller;
        address nftContract;
        uint256 nftId;
        uint256 startTime;
        uint256 endTime;
        uint256 startingPrice;
        uint256 currentPrice;
        address currentWinner;
        address paymentToken;
        AuctionStatus status;
    }

    // 拍卖ID到拍卖信息的映射
    mapping(uint256 => AuctionInfo) public auctions;
    uint256 public nextAuctionId;

address public factory;

// Chainlink价格预言机
AggregatorV3Interface public ethUsdPriceFeed;
    mapping(address => AggregatorV3Interface) public tokenUsdPriceFeeds;

    // 手续费参数
    uint256 public baseFeePercentage;
    uint256 public maxFeePercentage;
    uint256 public feeThreshold;

    // 事件
    event AuctionCreated(uint256 indexed auctionId, address indexed seller, address indexed nftContract, uint256 nftId);
    event BidPlaced(uint256 indexed auctionId, address indexed bidder, uint256 amount);
    event AuctionEnded(uint256 indexed auctionId, address indexed winner, uint256 amount);
    event AuctionCancelled(uint256 indexed auctionId);
    event AuctionUpgraded(address indexed newImplementation);

    function initialize(
    address _ethUsdPriceFeed,
    uint256 _baseFeePercentage,
    uint256 _maxFeePercentage,
    uint256 _feeThreshold,
    address initialOwner,
    address _factory
) public initializer virtual returns (uint256) {
    __Ownable_init(initialOwner);
    ethUsdPriceFeed = AggregatorV3Interface(_ethUsdPriceFeed);
    baseFeePercentage = _baseFeePercentage;
    maxFeePercentage = _maxFeePercentage;
    feeThreshold = _feeThreshold;
    nextAuctionId = 0;
    factory = _factory;
    return baseFeePercentage;
}

    // 设置价格预言机
    function setTokenPriceFeed(address token, address priceFeed) external onlyOwner {
        tokenUsdPriceFeeds[token] = AggregatorV3Interface(priceFeed);
    }

    // 创建拍卖
    function createAuction(
        address nftContract,
        uint256 nftId,
        uint256 startingPrice,
        uint256 duration,
        address paymentToken
    ) external {
        require(IERC721(nftContract).ownerOf(nftId) == msg.sender, "Not owner of NFT");
        require(startingPrice > 0, "Starting price must be greater than 0");
        require(duration > 0, "Duration must be greater than 0");

        // 确保NFT已被批准转让
        require(IERC721(nftContract).isApprovedForAll(msg.sender, address(this)) ||
                IERC721(nftContract).getApproved(nftId) == address(this), "NFT not approved");

        uint256 auctionId = nextAuctionId++;
        uint256 startTime = block.timestamp;
        uint256 endTime = startTime + duration;

        auctions[auctionId] = AuctionInfo({
            seller: msg.sender,
            nftContract: nftContract,
            nftId: nftId,
            startTime: startTime,
            endTime: endTime,
            startingPrice: startingPrice,
            currentPrice: startingPrice,
            currentWinner: address(0),
            paymentToken: paymentToken,
            status: AuctionStatus.Active
        });

        emit AuctionCreated(auctionId, msg.sender, nftContract, nftId);
    }

    // 出价
    function placeBid(uint256 auctionId) external payable virtual {
        AuctionInfo storage auction = auctions[auctionId];
        require(auction.status == AuctionStatus.Active, "Auction not active");
        require(block.timestamp < auction.endTime, "Auction ended");

        uint256 bidAmount;
        if (auction.paymentToken == address(0)) {
            // ETH出价
            bidAmount = msg.value;
            require(bidAmount > auction.currentPrice, "Bid amount too low");
        } else {
            // ERC20代币出价
            require(msg.value == 0, "Cannot send ETH for ERC20 auction");
            bidAmount = IERC20(auction.paymentToken).allowance(msg.sender, address(this));
            require(bidAmount > auction.currentPrice, "Bid amount too low");

            // 转移代币
            IERC20(auction.paymentToken).transferFrom(msg.sender, address(this), bidAmount);
        }

        // 退还之前最高出价者的资金
        if (auction.currentWinner != address(0)) {
            if (auction.paymentToken == address(0)) {
                payable(auction.currentWinner).transfer(auction.currentPrice);
            } else {
                IERC20(auction.paymentToken).transfer(auction.currentWinner, auction.currentPrice);
            }
        }

        // 更新拍卖信息
        auction.currentPrice = bidAmount;
        auction.currentWinner = msg.sender;

        emit BidPlaced(auctionId, msg.sender, bidAmount);
    }

    // 结束拍卖
    function endAuction(uint256 auctionId) external {
        AuctionInfo storage auction = auctions[auctionId];
        require(auction.status == AuctionStatus.Active, "Auction not active");
        require(block.timestamp >= auction.endTime, "Auction not ended yet");

        auction.status = AuctionStatus.Ended;

        if (auction.currentWinner != address(0)) {
            // 计算手续费
            uint256 fee = calculateFee(auction.currentPrice);
            uint256 sellerAmount = auction.currentPrice - fee;

            // 转移NFT给最高出价者
            IERC721(auction.nftContract).safeTransferFrom(auction.seller, auction.currentWinner, auction.nftId);

            // 转移资金给卖家
            if (auction.paymentToken == address(0)) {
                payable(auction.seller).transfer(sellerAmount);
            } else {
                IERC20(auction.paymentToken).transfer(auction.seller, sellerAmount);
            }

            emit AuctionEnded(auctionId, auction.currentWinner, auction.currentPrice);
        } else {
            // 没有出价，拍卖结束但NFT未售出
            emit AuctionEnded(auctionId, address(0), 0);
        }
    }

    // 取消拍卖
    function cancelAuction(uint256 auctionId) external {
        AuctionInfo storage auction = auctions[auctionId];
        require(auction.seller == msg.sender, "Only seller can cancel");
        require(auction.status == AuctionStatus.Active, "Auction not active");
        require(auction.currentWinner == address(0), "Cannot cancel after bids");

        auction.status = AuctionStatus.Cancelled;

        emit AuctionCancelled(auctionId);
    }

    // 计算动态手续费
    function calculateFee(uint256 amount) public view returns (uint256) {
        if (amount <= feeThreshold) {
            return (amount * baseFeePercentage) / 10000;
        } else {
            uint256 excess = amount - feeThreshold;
            uint256 excessFee = (excess * maxFeePercentage) / 10000;
            uint256 baseFee = (feeThreshold * baseFeePercentage) / 10000;
            return baseFee + excessFee;
        }
    }

    // 获取价格（美元）
    function getPriceInUSD(address token, uint256 amount) public view returns (uint256) {
        if (token == address(0)) {
            // ETH价格
            (, int256 price, , , ) = ethUsdPriceFeed.latestRoundData();
            return (amount * uint256(price)) / (10 ** 8); // 假设价格Feed有8位小数
        } else {
            // ERC20代币价格
            AggregatorV3Interface priceFeed = tokenUsdPriceFeeds[token];
            require(address(priceFeed) != address(0), "No price feed for token");
            (, int256 price, , , ) = priceFeed.latestRoundData();
            return (amount * uint256(price)) / (10 ** 8); // 假设价格Feed有8位小数
        }
    }

    // 防止合约被销毁
    receive() external payable {}

    // 实现UUPS升级所需的函数
    function _authorizeUpgrade(address newImplementation) internal override {
        // 允许代理合约、合约所有者或工厂合约调用升级函数
        require(
            _msgSender() == address(this) || _msgSender() == owner() || _msgSender() == factory,
            "UUPSUnauthorizedCallContext"
        );
    }

    // 升级函数，允许代理合约调用
    function upgradeTo(address newImplementation) external onlyProxy {
        _authorizeUpgrade(newImplementation);
        super.upgradeToAndCall(newImplementation, bytes(''));
        emit AuctionUpgraded(newImplementation);
    }

    // 工厂升级函数，允许工厂合约调用
    function factoryUpgradeTo(address newImplementation) external {
        require(msg.sender == factory, "Only factory can call this function");
        require(newImplementation != address(0), "New implementation cannot be zero address");
        
        _authorizeUpgrade(newImplementation);
        // 直接更新实现地址
        assembly {
            sstore(_IMPLEMENTATION_SLOT, newImplementation)
        }
        emit AuctionUpgraded(newImplementation);
    }

    // UUPS代理实现槽位
    bytes32 private constant _IMPLEMENTATION_SLOT = 0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc;


}