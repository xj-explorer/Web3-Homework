// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./Auction.sol";
import "./AuctionV2.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

contract AuctionFactory is Initializable, UUPSUpgradeable, OwnableUpgradeable {
    // 调试事件
    event DebugLog(address indexed caller, address indexed proxy, string message);
    event DebugResult(bool success, bytes returnData);
    address public auctionImplementation;
    // 映射关系：拍卖ID到拍卖合约地址，用于记录每个拍卖合约的部署地址
    mapping(uint256 => address) public auctions;
    uint256 public nextAuctionId;
    // 新增：拍卖合约实现版本号
    uint256 public auctionVersion;

    event AuctionCreated(uint256 indexed auctionId, address indexed auctionAddress);
    event AuctionImplementationUpdated(address indexed newImplementation, uint256 indexed newVersion);

    constructor() {}

    function initialize(address _auctionImplementation) external virtual initializer {
        __Ownable_init(msg.sender);
        __UUPSUpgradeable_init();
        auctionImplementation = _auctionImplementation;
        nextAuctionId = 0;
        auctionVersion = 1;
    }

    // 实现UUPS升级所需的_authorizeUpgrade函数
    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}

    // 新增：更新拍卖合约实现地址
    function updateAuctionImplementation(address newImplementation) external onlyOwner {
        require(newImplementation != address(0), "New implementation cannot be zero address");
        auctionImplementation = newImplementation;
        auctionVersion++; // 增加版本号
        emit AuctionImplementationUpdated(newImplementation, auctionVersion);
    }

    // 创建新的拍卖合约实例（通过UUPS代理模式）
    function createAuctionContract(
        address ethUsdPriceFeed,
        uint256 baseFeePercentage,
        uint256 maxFeePercentage,
        uint256 feeThreshold
    ) external onlyOwner returns (address) {
        // 使用Create2部署UUPS代理合约
        // 将工厂合约自身设为拍卖合约的所有者，以便后续可以升级拍卖合约
        bytes memory data = abi.encodeWithSelector(Auction.initialize.selector, 
            ethUsdPriceFeed, baseFeePercentage, maxFeePercentage, feeThreshold, owner(), address(this));

        // 使用最小代理模式创建代理合约
        address proxy;
        bytes32 salt = keccak256(abi.encodePacked(nextAuctionId, block.timestamp));
        
        // 最小代理合约字节码
        bytes memory bytecode = abi.encodePacked(
            hex'3d602d80600a3d3981f3363d3d373d3d3d363d73',
            auctionImplementation,
            hex'5af43d82803e903d91602b57fd5bf3'
        );
        
        assembly {
            proxy := create2(0, add(bytecode, 32), mload(bytecode), salt)
        }

        // 调用初始化函数
        (bool success, bytes memory returnData) = proxy.call(data);
        require(success, "Initialization failed");
        // 验证初始化是否成功设置了baseFeePercentage
        uint256 initializedBaseFeePercentage = abi.decode(returnData, (uint256));
        require(initializedBaseFeePercentage == baseFeePercentage, "Initialization parameters not applied");

        // 记录拍卖合约地址
        uint256 auctionId = nextAuctionId++;
        auctions[auctionId] = proxy;

        emit AuctionCreated(auctionId, proxy);
        return proxy;
    }

    // 新增：批量升级拍卖合约
    function upgradeAuctions(uint256[] calldata auctionIds) external onlyOwner {
        require(auctionIds.length > 0, "No auction IDs provided");
        require(auctionIds.length <= 50, "Too many auctions to upgrade at once");

        for (uint256 i = 0; i < auctionIds.length; i++) {
            uint256 auctionId = auctionIds[i];
            address proxy = auctions[auctionId];
            require(proxy != address(0), "Auction does not exist");

            // 调用拍卖合约的factoryUpgradeTo函数
        Auction(payable(proxy)).factoryUpgradeTo(auctionImplementation);
        
        // 调用V2初始化函数
        if (auctionVersion == 2) {
            // 调试日志：输出调用者地址和代理地址
            emit DebugLog(msg.sender, proxy, "Initializing V2");
            
            // 使用低级别调用确保函数选择器被正确识别
            bytes memory data = abi.encodeWithSelector(AuctionV2.factoryInitializeV2.selector, address(this));
            (bool success, bytes memory returnData) = proxy.call(data);
            
            // 调试日志：输出调用结果
            emit DebugResult(success, returnData);
            
            require(success, "V2 initialization failed");
        }
        }
    }

    // 获取拍卖合约地址
    function getAuctionAddress(uint256 auctionId) external view returns (address) {
        return auctions[auctionId];
    }

    // 验证拍卖合约的初始化状态
    function verifyAuctionInitialization(uint256 auctionId, uint256 expectedBaseFeePercentage) external view returns (bool) {
        address auctionAddress = auctions[auctionId];
        require(auctionAddress != address(0), "Auction does not exist");
        
        // 调用拍卖合约的baseFeePercentage函数
        (bool success, bytes memory returnData) = auctionAddress.staticcall(abi.encodeWithSignature("baseFeePercentage()"));
        require(success, "Call to baseFeePercentage failed");
        
        uint256 actualBaseFeePercentage = abi.decode(returnData, (uint256));
        return actualBaseFeePercentage == expectedBaseFeePercentage;
    }
}