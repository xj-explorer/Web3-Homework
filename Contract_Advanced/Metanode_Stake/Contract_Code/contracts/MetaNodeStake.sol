// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";

// 导入可升级合约的初始化工具，用于初始化可升级合约的状态
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
// 导入 UUPS 可升级代理工具，支持 UUPS 模式的合约升级
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
// 导入可升级的访问控制工具，用于管理合约的权限控制
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
// 导入可升级的暂停工具，用于实现合约的暂停和恢复功能
import "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";

contract MetaNodeStake is Initializable, UUPSUpgradeable, PausableUpgradeable, AccessControlUpgradeable {

    using SafeERC20 for IERC20;
    using Address for address;
    using Math for uint256;

    // ETH 质押池的 ID，固定为 0
    uint256 public constant ETH_PID = 0;

    bytes32 public constant ADMIN_ROLE = keccak256("admin_role");
    bytes32 public constant UPGRADE_ROLE = keccak256("upgrade_role");

    struct Pool {
        // 质押代币的地址，若为 ETH 质押池则为 address(0x0)
        address stTokenAddress;
        // 质押池的权重，用于计算该池可获得的奖励比例
        uint256 poolWeight;
        // 该质押池上一次计算更新奖励的区块号，下次计算奖励时，需要在该区块号之后的区块进行计算
        uint256 lastRewardBlock;
        // 每个质押代币累计可获得的 MetaNode 奖励数量（精度为 1 ether）
        uint256 accMetaNodePerST;
        // 该质押池中已质押的代币总量
        uint256 stTokenAmount;
        // 该质押池的最小质押数量
        uint256 minDepositAmount;
        // 解除质押后需要锁定的区块数
        uint256 unstakeLockedBlocks;
    }

    // 解除质押请求结构体，记录解除质押的数量和解锁的区块号
    struct UnstakeRequest {
        // 申请解除质押的代币数量
        uint256 amount;
        // 解除质押后代币可解锁的区块号
        uint256 unlockBlocks;
    }

    // 用户信息结构体，记录用户在质押池中的相关信息
    struct User {
        // 用户当前质押的代币数量
        uint256 stAmount;
        // 用户已经结算完成的 MetaNode 奖励数量
        uint256 finishedMetaNode;
        // 用户待结算的 MetaNode 奖励数量
        uint256 pendingMetaNode;
        // 用户的解除质押请求列表
        UnstakeRequest[] requests;
    }


    /* ==========  状态变量  ========== */

    // MetaNodeStake 开始的第一个区块
    uint256 public startBlock;
    // MetaNodeStake 结束的第一个区块
    uint256 public endBlock;
    // 每个区块的 MetaNode 代币奖励数量
    uint256 public MetaNodePerBlock;

    // 暂停提现功能
    bool public withdrawPaused;
    // 暂停领取奖励功能
    bool public claimPaused;

    // MetaNode 代币合约实例
    IERC20 public MetaNode;

    // 质押池总权重 or 所有质押池权重之和
    uint256 public totalPoolWeight;
    
    // 质押池数组，存储所有质押池信息
    Pool[] public pool;

    // 质押池 ID => 用户地址 => 用户信息，记录每个质押池中每个用户的质押相关信息
    mapping (uint256 => mapping (address => User)) public user;


    /* ==========  事件EVENT  ========== */

    // 当设置 MetaNode 代币地址时触发此事件
    event SetMetaNode(IERC20 indexed MetaNode);

    // 当暂停提现功能时触发此事件
    event PauseWithdraw();

    // 当恢复提现功能时触发此事件
    event UnpauseWithdraw();

    // 当暂停领取奖励功能时触发此事件
    event PauseClaim();

    // 当恢复领取奖励功能时触发此事件
    event UnpauseClaim();

    // 当更新质押开始区块时触发此事件
    event SetStartBlock(uint256 indexed startBlock);

    // 当更新质押结束区块时触发此事件
    event SetEndBlock(uint256 indexed endBlock);

    // 当更新每个区块的 MetaNode 代币奖励数量时触发此事件
    event SetMetaNodePerBlock(uint256 indexed MetaNodePerBlock);

    // 当添加新的质押池时触发此事件
    event AddPool(address indexed stTokenAddress, uint256 indexed poolWeight, uint256 indexed lastRewardBlock, uint256 minDepositAmount, uint256 unstakeLockedBlocks);

    // 当更新质押池信息（最小质押数量和解除质押锁定区块数）时触发此事件
    event UpdatePoolInfo(uint256 indexed poolId, uint256 indexed minDepositAmount, uint256 indexed unstakeLockedBlocks);

    // 当更新质押池权重时触发此事件
    event SetPoolWeight(uint256 indexed poolId, uint256 indexed poolWeight, uint256 totalPoolWeight);

    // 当更新质押池奖励信息时触发此事件
    event UpdatePool(uint256 indexed poolId, uint256 indexed lastRewardBlock, uint256 totalMetaNode);

    // 当用户进行质押操作时触发此事件
    event Deposit(address indexed user, uint256 indexed poolId, uint256 amount);

    // 当用户发起解除质押请求时触发此事件
    event RequestUnstake(address indexed user, uint256 indexed poolId, uint256 amount);

    // 当用户提取已解锁的解除质押金额时触发此事件
    event Withdraw(address indexed user, uint256 indexed poolId, uint256 amount, uint256 indexed blockNumber);

    // 当用户领取 MetaNode 奖励时触发此事件
    event Claim(address indexed user, uint256 indexed poolId, uint256 MetaNodeReward);


    /* ==========  修饰符  ========== */
    
    // 修饰符：检查传入的质押池 ID 是否有效
    // 参数 _pid：待检查的质押池 ID
    // 若质押池 ID 无效（大于等于质押池数组长度），则抛出错误
    modifier checkPid(uint256 _pid) {
        require(_pid < pool.length, "invalid pid");
        _;
    }

    modifier whenNotClaimPaused() {
        require(!claimPaused, "claim is paused");
        _;
    }

    modifier whenNotWithdrawPaused() {
        require(!withdrawPaused, "withdraw is paused");
        _;
    }

    /**
     * @notice 设置 MetaNode 代币地址，并在部署时设置基本信息。
     * @param _MetaNode MetaNode 代币合约实例
     * @param _startBlock 质押开始的第一个区块号
     * @param _endBlock 质押结束的第一个区块号
     * @param _MetaNodePerBlock 每个区块的 MetaNode 代币奖励数量
     */
    function initialize(
        IERC20 _MetaNode,
        uint256 _startBlock,
        uint256 _endBlock,
        uint256 _MetaNodePerBlock
    ) public initializer {
        // 检查参数有效性，确保开始区块号不大于结束区块号，且每个区块的奖励数量大于 0
        require(_startBlock <= _endBlock && _MetaNodePerBlock > 0, "invalid parameters");

        // 初始化 AccessControl 功能
        __AccessControl_init();
        // 初始化 UUPS 可升级代理功能
        __UUPSUpgradeable_init();
        // 授予调用者默认管理员角色
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        // 授予调用者合约升级角色
        _grantRole(UPGRADE_ROLE, msg.sender);
        // 授予调用者管理员角色
        _grantRole(ADMIN_ROLE, msg.sender);

        // 设置 MetaNode 代币地址
        setMetaNode(_MetaNode);

        // 设置质押开始的第一个区块号
        startBlock = _startBlock;
        // 设置质押结束的第一个区块号
        endBlock = _endBlock;
        // 设置每个区块的 MetaNode 代币奖励数量
        MetaNodePerBlock = _MetaNodePerBlock;
    }

    function _authorizeUpgrade(address newImplementation) internal onlyRole(UPGRADE_ROLE) override{

    }

    
    /* ==========  管理员函数  ========== */

    /**
     * @notice 设置 MetaNode 代币地址。仅管理员可调用
     */
    function setMetaNode(IERC20 _MetaNode) public onlyRole(ADMIN_ROLE) {
        // 设置 MetaNode 代币合约地址
        MetaNode = _MetaNode;

        // 触发设置 MetaNode 代币地址事件
        emit SetMetaNode(MetaNode);
    }

    /**
     * @notice 暂停提现功能。仅管理员可调用。
     */
    function pauseWithdraw() public onlyRole(ADMIN_ROLE) {
        // 检查提现功能是否已经暂停，若已暂停则抛出错误
        require(!withdrawPaused, "withdraw has been already paused");

        // 设置提现功能为暂停状态
        withdrawPaused = true;

        // 触发暂停提现功能事件
        emit PauseWithdraw();
    }

    /**
     * @notice 恢复提现功能。仅管理员可调用。
     */
    function unpauseWithdraw() public onlyRole(ADMIN_ROLE) {
        // 检查提现功能是否已经恢复，若已恢复则抛出错误
        require(withdrawPaused, "withdraw has been already unpaused");

        // 设置提现功能为正常状态
        withdrawPaused = false;

        // 触发恢复提现功能事件
        emit UnpauseWithdraw();
    }

    /**
     * @notice 暂停领取奖励功能。仅管理员可调用。
     */
    function pauseClaim() public onlyRole(ADMIN_ROLE) {
        // 检查领取奖励功能是否已经暂停，若已暂停则抛出错误
        require(!claimPaused, "claim has been already paused");

        // 设置领取奖励功能为暂停状态
        claimPaused = true;

        // 触发暂停领取奖励功能事件
        emit PauseClaim();
    }

    /**
     * @notice 恢复领取奖励功能。仅管理员可调用。
     */
    function unpauseClaim() public onlyRole(ADMIN_ROLE) {
        // 检查领取奖励功能是否已经恢复，若已恢复则抛出错误
        require(claimPaused, "claim has been already unpaused");

        // 设置领取奖励功能为正常状态
        claimPaused = false;

        // 触发恢复领取奖励功能事件
        emit UnpauseClaim();
    }

    /**
     * @notice 更新质押开始区块。仅管理员可调用。
     */
    function setStartBlock(uint256 _startBlock) public onlyRole(ADMIN_ROLE) {
        // 检查新的开始区块号是否不大于结束区块号，若大于则抛出错误
        require(_startBlock <= endBlock, "start block must be smaller than end block");

        // 设置新的质押开始区块号
        startBlock = _startBlock;

        // 触发更新质押开始区块事件
        emit SetStartBlock(_startBlock);
    }

    /**
     * @notice 更新质押结束区块。仅管理员可调用。
     */
    function setEndBlock(uint256 _endBlock) public onlyRole(ADMIN_ROLE) {
        // 检查新的结束区块号是否不小于开始区块号，若小于则抛出错误
        require(startBlock <= _endBlock, "start block must be smaller than end block");

        // 设置新的质押结束区块号
        endBlock = _endBlock;

        // 触发更新质押结束区块事件
        emit SetEndBlock(_endBlock);
    }

    /**
     * @notice 更新每个区块的 MetaNode 代币奖励数量。仅管理员可调用。
     */
    function setMetaNodePerBlock(uint256 _MetaNodePerBlock) public onlyRole(ADMIN_ROLE) {
        // 检查每个区块的奖励数量是否大于 0，若不大于则抛出错误
        require(_MetaNodePerBlock > 0, "invalid parameter");

        // 设置新的每个区块的 MetaNode 代币奖励数量
        MetaNodePerBlock = _MetaNodePerBlock;

        // 触发更新每个区块的 MetaNode 代币奖励数量事件
        emit SetMetaNodePerBlock(_MetaNodePerBlock);
    }

    /**
     * @notice 添加一个新的质押池。仅管理员可调用
     * 注意：请勿重复添加相同的质押代币，否则 MetaNode 奖励计算会出错
     * @param _stTokenAddress 质押代币的地址，若为 ETH 质押池则为 address(0x0)
     * @param _poolWeight 质押池的权重，用于计算该池可获得的奖励比例
     * @param _minDepositAmount 该质押池的最小质押数量
     * @param _unstakeLockedBlocks 解除质押后需要锁定的区块数
     * @param _withUpdate 是否需要更新所有质押池的奖励信息
     */
    function addPool(address _stTokenAddress, uint256 _poolWeight, uint256 _minDepositAmount, uint256 _unstakeLockedBlocks,  bool _withUpdate) public onlyRole(ADMIN_ROLE) {
        // 默认第一个质押池为 ETH 质押池，因此第一个质押池的质押代币地址必须为 address(0x0)
        if (pool.length > 0) {
            require(_stTokenAddress != address(0x0), "Invalid staking token address");
        } else {
            require(_stTokenAddress == address(0x0), "Invalid staking token address");
        }
        // 允许最小质押数量为 0
        //require(_minDepositAmount > 0, "invalid min deposit amount");
        // 检查解除质押锁定区块数是否大于 0
        require(_unstakeLockedBlocks > 0, unicode"无效的解除质押锁定区块数");
        // 检查质押活动是否已经结束
        require(block.number < endBlock, unicode"质押活动已结束");

        // 如果需要更新，则批量更新所有质押池的奖励信息
        if (_withUpdate) {
            massUpdatePools();
        }

        // 计算该质押池最后一次更新奖励的区块号
        uint256 lastRewardBlock = block.number > startBlock ? block.number : startBlock;
        // 更新质押池总权重
        totalPoolWeight = totalPoolWeight + _poolWeight;

        // 向质押池数组中添加新的质押池
        pool.push(Pool({
            stTokenAddress: _stTokenAddress,
            poolWeight: _poolWeight,
            lastRewardBlock: lastRewardBlock,
            accMetaNodePerST: 0,
            stTokenAmount: 0,
            minDepositAmount: _minDepositAmount,
            unstakeLockedBlocks: _unstakeLockedBlocks
        }));

        // 触发添加新质押池事件
        emit AddPool(_stTokenAddress, _poolWeight, lastRewardBlock, _minDepositAmount, _unstakeLockedBlocks);
    }

    /**
     * @notice 更新指定质押池的信息（最小质押数量和解除质押锁定区块数）。仅管理员可调用。
     */
    function updatePool(uint256 _pid, uint256 _minDepositAmount, uint256 _unstakeLockedBlocks) public onlyRole(ADMIN_ROLE) checkPid(_pid) {
        // 更新指定质押池的最小质押数量
        pool[_pid].minDepositAmount = _minDepositAmount;
        // 更新指定质押池的解除质押锁定区块数
        pool[_pid].unstakeLockedBlocks = _unstakeLockedBlocks;

        // 触发更新质押池信息事件
        emit UpdatePoolInfo(_pid, _minDepositAmount, _unstakeLockedBlocks);
    }

    /**
     * @notice 更新指定质押池的权重。仅管理员可调用。
     */
    function setPoolWeight(uint256 _pid, uint256 _poolWeight, bool _withUpdate) public onlyRole(ADMIN_ROLE) checkPid(_pid) {
        // 检查质押池权重是否大于 0
        require(_poolWeight > 0, unicode"无效的质押池权重");
        
        // 如果需要更新，则批量更新所有质押池的奖励信息
        if (_withUpdate) {
            massUpdatePools();
        }

        // 更新质押池总权重
        totalPoolWeight = totalPoolWeight - pool[_pid].poolWeight + _poolWeight;
        // 更新指定质押池的权重
        pool[_pid].poolWeight = _poolWeight;

        // 触发更新质押池权重事件
        emit SetPoolWeight(_pid, _poolWeight, totalPoolWeight);
    }

    
    /* ==========  查询函数  ========== */

    /**
     * @notice 获取质押池的数量
     */
    function poolLength() external view returns(uint256) {
        return pool.length;
    }

    /**
     * @notice 返回从 _from 到 _to 区块范围内的奖励乘数（全部区块的奖励）
     * @param _from    起始区块号（包含）
     * @param _to      结束区块号（不包含）
     * getMultiplier(pool_.lastRewardBlock, block.number).tryMul(pool_.poolWeight);
     */
    function getMultiplier(uint256 _from, uint256 _to) public view returns(uint256 multiplier) {
        // 检查起始区块号是否不大于结束区块号
        require(_from <= _to, "invalid block");
        // 如果起始区块号小于质押开始区块号，将起始区块号设置为质押开始区块号
        if (_from < startBlock) {_from = startBlock;}
        // 如果结束区块号大于质押结束区块号，将结束区块号设置为质押结束区块号
        if (_to > endBlock) {_to = endBlock;}
        // 再次检查起始区块号是否不大于结束区块号
        require(_from <= _to, "end block must be greater than start block");
        bool success;
        // 计算区块数量与每个区块奖励数量的乘积（全部区块的奖励）
        // tryMul 是 OpenZeppelin 的 Math 库提供的安全乘法函数，它会尝试计算两个数的乘积。
        // 如果乘法操作会导致溢出，函数会返回 (false, 0)；如果乘法操作成功，会返回 (true, 乘积结果)。
        // 这里使用 tryMul 计算从 _from 到 _to 区块数量与每个区块奖励数量的乘积，避免溢出风险。
        (success, multiplier) = (_to - _from).tryMul(MetaNodePerBlock);
        require(success, "multiplier overflow");
    }

    /**
     * @notice 获取用户在指定质押池中的待领取 MetaNode 奖励数量
     */
    function pendingMetaNode(uint256 _pid, address _user) external checkPid(_pid) view returns(uint256) {
        return pendingMetaNodeByBlockNumber(_pid, _user, block.number);
    }

    /**
     * @notice 根据指定区块号获取用户在指定质押池中的待领取 MetaNode 奖励数量
     */
    function pendingMetaNodeByBlockNumber(uint256 _pid, address _user, uint256 _blockNumber) public checkPid(_pid) view returns(uint256) {
        // 获取指定质押池的信息
        Pool storage pool_ = pool[_pid];
        // 获取指定用户在该质押池中的信息
        User storage user_ = user[_pid][_user];
        // 获取当前质押池每个质押代币累计可获得的 MetaNode 奖励数量
        uint256 accMetaNodePerST = pool_.accMetaNodePerST;
        // 获取当前质押池中的质押代币总量
        uint256 stSupply = pool_.stTokenAmount;

        // 如果指定区块号大于质押池最后一次更新奖励的区块号，且质押池中有质押代币
        if (_blockNumber > pool_.lastRewardBlock && stSupply != 0) {
            // 计算从最后一次更新奖励的区块到指定区块的奖励乘数
            uint256 multiplier = getMultiplier(pool_.lastRewardBlock, _blockNumber);
            // 计算该质押池在这段区间内可获得的 MetaNode 奖励数量
            uint256 MetaNodeForPool = multiplier * pool_.poolWeight / totalPoolWeight;
            // 更新每个质押代币累计可获得的 MetaNode 奖励数量
            accMetaNodePerST = accMetaNodePerST + MetaNodeForPool * (1 ether) / stSupply;
        }

        // 计算用户的待领取奖励数量
        // user_.stAmount * accMetaNodePerST / (1 ether) 计算用户当前质押代币按当前累计奖励比例可获得的奖励数量
        // 由于 accMetaNodePerST 的精度为 1 ether，所以需要除以 1 ether 来还原实际奖励数量
        // user_.finishedMetaNode 是用户已经结算完成的 MetaNode 奖励数量，需要从总奖励中减去
        // user_.pendingMetaNode 是之前待结算但未领取的 MetaNode 奖励数量，需要累加到最终结果中
        return user_.stAmount * accMetaNodePerST / (1 ether) - user_.finishedMetaNode + user_.pendingMetaNode;
    }

    /**
     * @notice 获取用户在指定质押池中的质押数量
     */
    function stakingBalance(uint256 _pid, address _user) external checkPid(_pid) view returns(uint256) {
        return user[_pid][_user].stAmount;
    }

    /**
     * @notice 获取用户的解除质押金额信息，包括锁定的解除质押金额和已解锁的解除质押金额
     */
    function withdrawAmount(uint256 _pid, address _user) public checkPid(_pid) view returns(uint256 requestAmount, uint256 pendingWithdrawAmount) {
        // 获取指定用户在该质押池中的信息
        User storage user_ = user[_pid][_user];

        // 遍历用户的解除质押请求列表
        for (uint256 i = 0; i < user_.requests.length; i++) {
            // 如果解除质押请求已解锁
            if (user_.requests[i].unlockBlocks <= block.number) {
                // 累加已解锁的解除质押金额
                pendingWithdrawAmount = pendingWithdrawAmount + user_.requests[i].amount;
            }
            // 累加所有的解除质押请求金额
            requestAmount = requestAmount + user_.requests[i].amount;
        }
    }

    
    /* ==========  Pubilc函数  ========== */
    
    /**
     * @notice 更新指定质押池的奖励变量，使其保持最新状态。
     */
    function updatePool(uint256 _pid) public checkPid(_pid) {
        // 获取指定质押池的存储引用
        Pool storage pool_ = pool[_pid];

        // 如果当前区块号小于等于质押池最后一次更新奖励的区块号，直接返回
        if (block.number <= pool_.lastRewardBlock) {
            return;
        }

        // 计算从最后一次更新奖励的区块到当前区块的奖励乘数，并乘以质押池权重
        (bool success1, uint256 totalMetaNode) = getMultiplier(pool_.lastRewardBlock, block.number).tryMul(pool_.poolWeight);
        require(success1, "overflow");

        // 将总奖励数量除以质押池总权重，得到该质押池可获得的奖励数量
        (success1, totalMetaNode) = totalMetaNode.tryDiv(totalPoolWeight);
        require(success1, "overflow");

        // 获取当前质押池中的质押代币总量
        uint256 stSupply = pool_.stTokenAmount;
        // 如果质押池中有质押代币
        if (stSupply > 0) {
            // 将该质押池可获得的奖励数量乘以 1 ether，转换为指定精度
            (bool success2, uint256 totalMetaNode_) = totalMetaNode.tryMul(1 ether);
            require(success2, "overflow");

            // 将转换精度后的奖励数量除以质押代币总量，得到每个质押代币可获得的奖励数量
            (success2, totalMetaNode_) = totalMetaNode_.tryDiv(stSupply);
            require(success2, "overflow");

            // 将每个质押代币可获得的奖励数量累加到累计奖励数量上
            (bool success3, uint256 accMetaNodePerST) = pool_.accMetaNodePerST.tryAdd(totalMetaNode_);
            require(success3, "overflow");
            pool_.accMetaNodePerST = accMetaNodePerST;
        }

        // 更新质押池最后一次更新奖励的区块号为当前区块号
        pool_.lastRewardBlock = block.number;

        // 触发更新质押池奖励信息事件
        emit UpdatePool(_pid, pool_.lastRewardBlock, totalMetaNode);
    }

    /**
     * @notice 更新所有质押池的奖励变量。注意 gas 消耗！
     */
    function massUpdatePools() public {
        // 获取质押池的数量
        uint256 length = pool.length;
        // 遍历所有质押池，依次更新奖励变量
        for (uint256 pid = 0; pid < length; pid++) {
            updatePool(pid);
        }
    }

    /**
     * @notice 质押 ETH 以获取 MetaNode 奖励
     */
    function depositETH() public whenNotPaused() payable {
        // 获取 ETH 质押池的存储引用
        Pool storage pool_ = pool[ETH_PID];
        // 验证当前质押池是否为 ETH 质押池
        require(pool_.stTokenAddress == address(0x0), "invalid staking token address");

        // 获取用户发送的 ETH 数量
        uint256 _amount = msg.value;
        // 验证质押数量是否大于等于最小质押数量
        require(_amount >= pool_.minDepositAmount, "deposit amount is too small");

        // 调用内部质押函数进行质押操作
        _deposit(ETH_PID, _amount);
    }

    /**
     * @notice 质押代币以获取 MetaNode 奖励
     * 在质押前，用户需要授权本合约能够花费或转移他们的质押代币
     *
     * @param _pid       要质押到的质押池 ID
     * @param _amount    要质押的代币数量
     */
    function deposit(uint256 _pid, uint256 _amount) public whenNotPaused() checkPid(_pid) {
        // 验证当前操作不支持 ETH 质押
        require(_pid != 0, "deposit not support ETH staking");
        // 获取指定质押池的存储引用
        Pool storage pool_ = pool[_pid];
        // 验证质押数量是否大于最小质押数量
        require(_amount > pool_.minDepositAmount, "deposit amount is too small");

        // 如果质押数量大于 0，从用户账户转移代币到合约账户
        if(_amount > 0) {
            IERC20(pool_.stTokenAddress).safeTransferFrom(msg.sender, address(this), _amount);
        }

        // 调用内部质押函数进行质押操作
        _deposit(_pid, _amount);
    }

    /**
     * @notice 解除质押代币
     *
     * @param _pid       要解除质押的质押池 ID
     * @param _amount    要解除质押的代币数量
     */
    function unstake(uint256 _pid, uint256 _amount) public whenNotPaused() checkPid(_pid) whenNotWithdrawPaused() {
        // 获取指定质押池的存储引用
        Pool storage pool_ = pool[_pid];
        // 获取当前用户在该质押池的存储引用
        User storage user_ = user[_pid][msg.sender];

        // 验证用户的质押数量是否足够
        require(user_.stAmount >= _amount, "Not enough staking token balance");

        // 更新指定质押池的奖励变量，即更新每个质押代币可获得的奖励
        updatePool(_pid);

        // 计算用户的待领取奖励数量
        uint256 pendingMetaNode_ = user_.stAmount * pool_.accMetaNodePerST / (1 ether) - user_.finishedMetaNode;

        // 如果待领取奖励数量大于 0，将其累加到待结算奖励数量中
        if(pendingMetaNode_ > 0) {
            user_.pendingMetaNode = user_.pendingMetaNode + pendingMetaNode_;
        }

        // 如果解除质押数量大于 0，更新用户质押数量并添加解除质押请求
        if(_amount > 0) {
            user_.stAmount = user_.stAmount - _amount;
            user_.requests.push(UnstakeRequest({
                amount: _amount,
                unlockBlocks: block.number + pool_.unstakeLockedBlocks
            }));
        }

        // 更新质押池中的质押代币总量
        pool_.stTokenAmount = pool_.stTokenAmount - _amount;
        // 更新用户已结算完成的奖励数量
        user_.finishedMetaNode = user_.stAmount * pool_.accMetaNodePerST / (1 ether);

        // 触发用户发起解除质押请求事件
        emit RequestUnstake(msg.sender, _pid, _amount);
    }

    /**
     * @notice 提取已解锁的解除质押金额
     *
     * @param _pid       要提取的质押池 ID
     */
    function withdraw(uint256 _pid) public whenNotPaused() checkPid(_pid) whenNotWithdrawPaused() {
        // 获取指定质押池的存储引用
        Pool storage pool_ = pool[_pid];
        // 获取当前用户在该质押池的存储引用
        User storage user_ = user[_pid][msg.sender];

        // 已解锁可提取的金额
        uint256 pendingWithdraw_;
        // 需要移除的解除质押请求数量
        uint256 popNum_;
        // 遍历用户的解除质押请求列表，统计已解锁的金额和需要移除的请求数量（这里的每一项unlockBlocks是递增的，越后面的解锁时间越晚）
        for (uint256 i = 0; i < user_.requests.length; i++) {
            if (user_.requests[i].unlockBlocks > block.number) {
                break;
            }
            pendingWithdraw_ = pendingWithdraw_ + user_.requests[i].amount;
            popNum_++;
        }

        // 将未解锁的解除质押请求前移
        for (uint256 i = 0; i < user_.requests.length - popNum_; i++) {
            user_.requests[i] = user_.requests[i + popNum_];
        }

        // 移除已解锁的解除质押请求
        for (uint256 i = 0; i < popNum_; i++) {
            user_.requests.pop();
        }

        // 如果有已解锁的金额，进行转账操作
        if (pendingWithdraw_ > 0) {
            if (pool_.stTokenAddress == address(0x0)) {
                // 如果是 ETH 质押池，安全转移 ETH 到用户账户
                _safeETHTransfer(msg.sender, pendingWithdraw_);
            } else {
                // 如果是代币质押池，安全转移代币到用户账户
                IERC20(pool_.stTokenAddress).safeTransfer(msg.sender, pendingWithdraw_);
            }
        }

        // 触发用户提取已解锁的解除质押金额事件
        emit Withdraw(msg.sender, _pid, pendingWithdraw_, block.number);
    }

    /**
     * @notice 领取 MetaNode 代币奖励
     *
     * @param _pid       要领取奖励的质押池 ID
     */
    function claim(uint256 _pid) public whenNotPaused() checkPid(_pid) whenNotClaimPaused() {
        // 获取指定质押池的存储引用
        Pool storage pool_ = pool[_pid];
        // 获取当前用户在该质押池的存储引用
        User storage user_ = user[_pid][msg.sender];

        // 更新指定质押池的奖励变量
        updatePool(_pid);

        // 计算用户的待领取奖励数量
        uint256 pendingMetaNode_ = user_.stAmount * pool_.accMetaNodePerST / (1 ether) - user_.finishedMetaNode + user_.pendingMetaNode;

        // 如果待领取奖励数量大于 0，将待结算奖励数量置为 0，并安全转移奖励到用户账户
        if(pendingMetaNode_ > 0) {
            user_.pendingMetaNode = 0;
            _safeMetaNodeTransfer(msg.sender, pendingMetaNode_);
        }

        // 更新用户已结算完成的奖励数量
        user_.finishedMetaNode = user_.stAmount * pool_.accMetaNodePerST / (1 ether);

        // 触发用户领取 MetaNode 奖励事件
        emit Claim(msg.sender, _pid, pendingMetaNode_);
    }

    
    /* ==========  Internal函数  ========== */
    
    /**
     * @notice 存入质押代币以获取 MetaNode 奖励
     *
     * @param _pid       要存入的质押池 ID
     * @param _amount    要存入的质押代币数量
     */
    function _deposit(uint256 _pid, uint256 _amount) internal {
        // 获取指定质押池的信息
        Pool storage pool_ = pool[_pid];
        // 获取当前调用者在该质押池中的用户信息
        User storage user_ = user[_pid][msg.sender];

        // 更新指定质押池的奖励信息
        updatePool(_pid);

        // 如果用户已有质押数量
        if (user_.stAmount > 0) {
            // uint256 accST = user_.stAmount.mulDiv(pool_.accMetaNodePerST, 1 ether);
            // 尝试计算用户当前质押数量乘以每个质押代币累计可获得的 MetaNode 奖励数量
            (bool success1, uint256 accST) = user_.stAmount.tryMul(pool_.accMetaNodePerST);
            require(success1, "user stAmount mul accMetaNodePerST overflow");
            // 尝试将上述结果除以 1 ether 以得到实际奖励数量
            (success1, accST) = accST.tryDiv(1 ether);
            require(success1, "accST div 1 ether overflow");
            
            // 尝试计算待领取的 MetaNode 奖励数量（当前可获得奖励减去已结算奖励）
            (bool success2, uint256 pendingMetaNode_) = accST.trySub(user_.finishedMetaNode);
            require(success2, "accST sub finishedMetaNode overflow");

            // 如果有待领取的奖励
            if(pendingMetaNode_ > 0) {
                // 尝试将待领取奖励累加到用户的待结算奖励中
                (bool success3, uint256 _pendingMetaNode) = user_.pendingMetaNode.tryAdd(pendingMetaNode_);
                require(success3, "user pendingMetaNode overflow");
                user_.pendingMetaNode = _pendingMetaNode;
            }
        }

        // 如果存入数量大于 0
        if(_amount > 0) {
            // 尝试将存入数量累加到用户的质押数量中
            (bool success4, uint256 stAmount) = user_.stAmount.tryAdd(_amount);
            require(success4, "user stAmount overflow");
            user_.stAmount = stAmount;
        }

        // 尝试将存入数量累加到质押池的总质押数量中
        (bool success5, uint256 stTokenAmount) = pool_.stTokenAmount.tryAdd(_amount);
        require(success5, "pool stTokenAmount overflow");
        pool_.stTokenAmount = stTokenAmount;

        // user_.finishedMetaNode = user_.stAmount.mulDiv(pool_.accMetaNodePerST, 1 ether);
        // 尝试计算用户当前质押数量乘以每个质押代币累计可获得的 MetaNode 奖励数量
        // 计算用户当前质押代币按当前累计奖励比例可获得的总奖励数量。
        // pool_.accMetaNodePerST 表示每个质押代币累计可获得的 MetaNode 奖励数量（精度为 1 ether），
        // 将用户质押数量 user_.stAmount 与 accMetaNodePerST 相乘，得到用户当前应得的总奖励（含精度）。
        // 使用 tryMul 避免乘法溢出风险。
        (bool success6, uint256 finishedMetaNode) = user_.stAmount.tryMul(pool_.accMetaNodePerST);
        require(success6, "user stAmount mul accMetaNodePerST overflow");

        // 尝试将上述结果除以 1 ether 以得到实际已结算奖励数量
        (success6, finishedMetaNode) = finishedMetaNode.tryDiv(1 ether);
        require(success6, "finishedMetaNode div 1 ether overflow");

        // 更新用户已结算的 MetaNode 奖励数量，此奖励是更新质押池奖励变量后计算得出的奖励
        user_.finishedMetaNode = finishedMetaNode;

        // 触发用户质押事件
        emit Deposit(msg.sender, _pid, _amount);
    }

    /**
     * @notice 安全的 MetaNode 代币转移函数，防止因舍入误差导致池中 MetaNode 数量不足
     *
     * @param _to        接收 MetaNode 代币的地址
     * @param _amount    要转移的 MetaNode 代币数量
     */
    function _safeMetaNodeTransfer(address _to, uint256 _amount) internal {
        // 获取当前合约持有的 MetaNode 代币余额
        uint256 MetaNodeBal = MetaNode.balanceOf(address(this));

        // 如果要转移的数量大于合约余额，则转移全部余额
        if (_amount > MetaNodeBal) {
            MetaNode.transfer(_to, MetaNodeBal);
        } else {
            // 否则转移指定数量的代币
            MetaNode.transfer(_to, _amount);
        }
    }

    /**
     * @notice 安全的 ETH 转移函数
     *
     * @param _to        接收 ETH 的地址
     * @param _amount    要转移的 ETH 数量
     */
    function _safeETHTransfer(address _to, uint256 _amount) internal {
        // 尝试向指定地址发送 ETH
        (bool success, bytes memory data) = address(_to).call{
            value: _amount
        }("");

        // 检查调用是否成功
        require(success, "ETH transfer call failed");
        // 如果返回数据长度大于 0，检查操作是否成功
        if (data.length > 0) {
            require(
                abi.decode(data, (bool)),
                "ETH transfer operation did not succeed"
            );
        }
    }
}