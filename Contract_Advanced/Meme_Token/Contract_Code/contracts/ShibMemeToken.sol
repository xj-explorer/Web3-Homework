// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "hardhat/console.sol";

/**
 * @title ShibMemeToken
 * @dev SHIB风格的Meme代币合约，实现了代币税、流动性池集成和交易限制功能
 */
contract ShibMemeToken is ERC20, Ownable {
    // 代币常量设置
    uint256 public constant MAX_SUPPLY = 10000000000 * 10 ** 18; // 1万亿代币总量
    uint256 public constant MAX_TRANSACTION_AMOUNT = 500000000 * 10 ** 18; // 单笔最大交易金额（50亿）
    uint256 public constant MAX_DAILY_TRANSACTIONS = 10; // 每日最大交易次数
    uint256 public constant TAX_RATE = 45; // 交易税率（45%）
    uint256 public constant LIQUIDITY_SHARE = 50; // 税费中分配给流动性池的比例（50%）
    uint256 public constant TREASURY_SHARE = 50; // 税费中分配给金库的比例（50%）

    // 地址和状态变量
    /**
     * @dev 流动性池地址，用于存放分配给流动性池的代币。
     * 该地址在合约部署后不可修改，使用 immutable 关键字确保其值只能在构造函数中设置。
     */
    address public immutable liquidityPoolAddress; 
    /**
     * @dev 金库地址，用于存放分配给金库的代币。
     * 在Meme代币合约中，金库地址的主要用途包括：
     * 1. 接收交易税费的一部分（根据TREASURY_SHARE配置的比例）
     * 2. 为项目开发、维护和运营提供资金支持
     * 3. 用于社区激励、营销活动或其他项目相关支出
     * 注意：金库地址和合约所有者（owner）是两个不同的概念。
     * 该地址可以通过合约所有者调用 setTreasuryAddress 函数进行修改。
     */
    address public treasuryAddress;
    /**
     * @dev 记录每个地址的上次交易时间，用于判断是否进入新的一天以重置交易计数。
     * 键为地址，值为上次交易的时间戳（以秒为单位）。
     */
    mapping(address => uint256) public lastTransactionTime;
    /**
     * @dev 记录每个地址的每日交易次数，用于检查是否超过每日最大交易次数限制。
     * 键为地址，值为该地址在当前自然日的交易次数。
     */
    mapping(address => uint256) public dailyTransactionCount;

    // 交易事件
    /**
     * @dev 当交易收取税费时触发该事件
     * @param from 发送者地址
     * @param to 接收者地址
     * @param amount 交易总金额
     * @param taxAmount 收取的税费金额
     */
    event TaxCollected(address indexed from, address indexed to, uint256 amount, uint256 taxAmount);
    /**
     * @dev 当向流动性池添加流动性时触发该事件
     * @param provider 流动性提供者地址
     * @param amount 添加的代币数量
     */
    event LiquidityAdded(address indexed provider, uint256 amount);
    /**
     * @dev 当交易超过限制时触发该事件
     * @param sender 发送者地址
     * @param attemptedAmount 尝试交易的金额
     */
    event TransactionLimitExceeded(address indexed sender, uint256 attemptedAmount);

    /**
     * @dev 构造函数，初始化代币名称、符号、流动性池地址和金库地址
     * @param _initialOwner 合约初始所有者地址
     * @param _liquidityPoolAddress 初始流动性池地址
     * @param _treasuryAddress 初始金库地址
     */
    constructor(
        address _initialOwner,
        address _liquidityPoolAddress,
        address _treasuryAddress
    ) ERC20("Shib Meme Token", "SHIBMEME") Ownable(_initialOwner) {
        require(
            _initialOwner != address(0) && _liquidityPoolAddress != address(0) && _treasuryAddress != address(0),
            "Invalid address"
        );
        liquidityPoolAddress = _liquidityPoolAddress;
        treasuryAddress = _treasuryAddress;
        
        // 铸造最大供应量的代币给部署者
        _mint(_initialOwner, MAX_SUPPLY);
    }

    /**
     * @dev 设置新的金库地址
     * @param _newTreasuryAddress 新的金库地址
     */
    function setTreasuryAddress(address _newTreasuryAddress) external onlyOwner {
        require(_newTreasuryAddress != address(0), "Invalid address");
        treasuryAddress = _newTreasuryAddress;
    }

    /**
     * @dev 检查并更新交易限制
     * @param sender 发送者地址
     * @param amount 交易金额
     */
    function _checkTransactionLimits(address sender, uint256 amount) internal {
        // 检查交易金额是否超过最大限制
        require(amount <= MAX_TRANSACTION_AMOUNT, "Transaction amount exceeds maximum");
        
        // 检查是否新的一天开始，重置交易计数
        // Solidity中的时间单位: 1 days = 86400秒（一天的秒数）
        // 在Solidity中，除法运算对于整数类型会自动向下取整（截断小数部分），当两个整数相除时，结果会自动截断小数部分，只保留整数部分。
        uint256 currentDay = block.timestamp / 1 days;
        
        // 计算发送者上次交易的自然日
        // 如果用户是第一次交易，lastTransactionTime[sender]默认为0，lastTransactionDay也为0
        uint256 lastTransactionDay = lastTransactionTime[sender] / 1 days;
        
        // 比较两次交易的自然日，如果不是同一天（上次交易的日期小于当前日期），则重置该地址的每日交易计数为0
        if (lastTransactionDay < currentDay) {
            dailyTransactionCount[sender] = 0;
        }
        
        // 检查每日交易次数是否超过限制
        require(dailyTransactionCount[sender] < MAX_DAILY_TRANSACTIONS, "Daily transaction limit exceeded");
        
        // 更新交易时间和计数
        lastTransactionTime[sender] = block.timestamp;
        dailyTransactionCount[sender]++;
    }

    /**
     * @dev 计算并应用交易税
     * @param from 发送者地址
     * @param to 接收者地址
     * @param amount 交易金额
     * @return 实际转账的金额（扣除税后）
     */
    // 实际税费逻辑直接在transfer和transferFrom函数中实现
    function _applyTransactionTax(address from, address to, uint256 amount) internal view returns (uint256) {
        // 对买入/卖出交易应用税费（排除流动性池和金库地址的交易，与transfer/transferFrom函数保持一致）
        if (from == liquidityPoolAddress || to == liquidityPoolAddress || from == treasuryAddress || to == treasuryAddress) {
            return amount; // 不征税
        }
        
        // 计算税费
        uint256 taxAmount = (amount * TAX_RATE) / 100;
        return amount - taxAmount;
    }

    /**
     * @dev 分配交易税费
     * @param from 发送者地址
     * @param amount 交易金额
     */
    function _distributeTax(address from, uint256 amount) internal {
        // 计算税费
        uint256 taxAmount = (amount * TAX_RATE) / 100;
        
        // 计算分配给流动性池和金库的金额
        uint256 liquidityAmount = (taxAmount * LIQUIDITY_SHARE) / 100;
        uint256 treasuryAmount = taxAmount - liquidityAmount;
        
        // 分配税费
        // super调用的是ERC20父合约的_transfer方法，用于执行实际的代币转账操作，这里不需要处理税费
        if (liquidityAmount > 0) {
            super._transfer(from, liquidityPoolAddress, liquidityAmount);
        }
        if (treasuryAmount > 0) {
            super._transfer(from, treasuryAddress, treasuryAmount);
        }
    }

    /**
     * @dev 重写ERC20的transfer函数，实现交易限制和税费功能
     * @param to 接收者地址
     * @param amount 交易金额
     * @return 交易是否成功
     */
    function transfer(address to, uint256 amount) public override returns (bool) {
        address from = _msgSender();
        
        // 检查交易限制（除了合约部署者和系统地址外）
        if (from != owner() && from != address(this) && to != address(this)) {
            _checkTransactionLimits(from, amount);
        }
        
        // 对普通交易征税，对流动性池和金库地址的交易免税
        bool shouldTax = !(from == liquidityPoolAddress || to == liquidityPoolAddress || 
                          from == treasuryAddress || to == treasuryAddress);
        
        // 添加详细的日志记录用于调试
        console.log("transfer - from:", from);
        console.log("transfer - to:", to);
        console.log("transfer - amount:", amount);
        console.log("transfer - shouldTax:", shouldTax);
        console.log("transfer - TAX_RATE:", TAX_RATE);
        
        if (shouldTax) {
            // 使用合约中定义的TAX_RATE常量计算税费
            uint256 taxAmount = (amount * TAX_RATE) / 100;
            uint256 netAmount = amount - taxAmount;
            
            // 添加税费计算的详细日志
            console.log("transfer - taxAmount:", taxAmount);
            console.log("transfer - netAmount:", netAmount);
            
            // 分配税费（各占50%）
            uint256 liquidityAmount = (taxAmount * LIQUIDITY_SHARE) / 100;
            uint256 treasuryAmount = (taxAmount * TREASURY_SHARE) / 100;
            
            console.log("transfer - liquidityAmount:", liquidityAmount);
            console.log("transfer - treasuryAmount:", treasuryAmount);
            
            // 从发送者转给接收者净金额
            super._transfer(from, to, netAmount);
            
            // 从发送者转给流动性池和金库税费部分
            if (liquidityAmount > 0) {
                super._transfer(from, liquidityPoolAddress, liquidityAmount);
            }
            if (treasuryAmount > 0) {
                super._transfer(from, treasuryAddress, treasuryAmount);
            }
            
            // 触发税费收取事件
            emit TaxCollected(from, to, amount, taxAmount);
        } else {
            // 不征税，直接转账全额
            super._transfer(from, to, amount);
        }
        
        return true;
    }

    /**
     * @dev 重写ERC20的transferFrom函数，实现交易限制和税费功能
     * @param from 发送者地址
     * @param to 接收者地址
     * @param amount 交易金额
     * @return 交易是否成功
     */
    function transferFrom(address from, address to, uint256 amount) public override returns (bool) {
        // 获取消息发送者地址，即代币授权的调用者
        address spender = _msgSender();
        // 扣除发送者授权给调用者的代币额度
        _spendAllowance(from, spender, amount);
        
        // 检查交易限制（除了合约部署者和系统地址外）
        if (from != owner() && from != address(this) && to != address(this)) {
            _checkTransactionLimits(from, amount);
        }
        
        // 对普通交易征税，对流动性池和金库地址的交易免税
        bool shouldTax = !(from == liquidityPoolAddress || to == liquidityPoolAddress || 
                          from == treasuryAddress || to == treasuryAddress);
        
        // 添加详细的日志记录用于调试
        console.log("transferFrom - from:", from);
        console.log("transferFrom - to:", to);
        console.log("transferFrom - amount:", amount);
        console.log("transferFrom - shouldTax:", shouldTax);
        console.log("transferFrom - TAX_RATE:", TAX_RATE);
        
        if (shouldTax) {
            // 使用合约中定义的TAX_RATE常量计算税费
            uint256 taxAmount = (amount * TAX_RATE) / 100;
            uint256 netAmount = amount - taxAmount;
            
            // 添加税费计算的详细日志
            console.log("transferFrom - taxAmount:", taxAmount);
            console.log("transferFrom - netAmount:", netAmount);
            
            // 分配税费（各占50%）
            uint256 liquidityAmount = (taxAmount * LIQUIDITY_SHARE) / 100;
            uint256 treasuryAmount = (taxAmount * TREASURY_SHARE) / 100;
            
            console.log("transferFrom - liquidityAmount:", liquidityAmount);
            console.log("transferFrom - treasuryAmount:", treasuryAmount);
            
            // 从发送者转给接收者净金额
            super._transfer(from, to, netAmount);
            
            // 从发送者转给流动性池和金库税费部分
            if (liquidityAmount > 0) {
                super._transfer(from, liquidityPoolAddress, liquidityAmount);
            }
            if (treasuryAmount > 0) {
                super._transfer(from, treasuryAddress, treasuryAmount);
            }
            
            // 触发税费收取事件
            emit TaxCollected(from, to, amount, taxAmount);
        } else {
            // 不征税，直接转账全额
            super._transfer(from, to, amount);
        }
        
        return true;
    }

    /**
     * @dev 向流动性池添加流动性
     * @param amount 要添加的代币数量
     */
    function addLiquidity(uint256 amount) external {
        require(amount > 0, "Amount must be greater than 0");
        
        // 转账代币到流动性池 - 使用super.transfer避免再次触发税费和限制检查
        super._transfer(_msgSender(), liquidityPoolAddress, amount);
        
        // 触发流动性添加事件
        emit LiquidityAdded(_msgSender(), amount);
    }

    /**
     * @dev 从流动性池移除流动性（仅所有者可调用）
     * @param amount 要移除的代币数量
     */
    function removeLiquidity(uint256 amount) external onlyOwner {
        require(amount > 0, "Amount must be greater than 0");
        require(balanceOf(liquidityPoolAddress) >= amount, "Insufficient liquidity");
        
        // 从流动性池转账代币到调用者 - 使用super.transfer避免再次触发税费和限制检查
        super._transfer(liquidityPoolAddress, _msgSender(), amount);
    }
}