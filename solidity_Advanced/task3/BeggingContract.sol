// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

contract BeggingContract {
    // 定义捐赠者结构体
    struct Donor {
        address donorAddress;
        uint256 donationAmount;
    }
    
    // 合约所有者（可支付地址）
    address payable private immutable owner;
    
    // 记录每个捐赠者的累计捐赠金额（用于快速查询）
    mapping(address => uint256) public donations;
    
    // 使用结构体数组存储所有捐赠者信息
    Donor[] private donors;
    
    // 捐赠时间范围
    uint256 public donationStartTime;
    uint256 public donationEndTime;
    
    // 捐赠事件
    event Donation(address indexed donor, uint256 amount, uint256 timestamp);
    
    // 仅所有者可调用的修饰符
    modifier onlyOwner() {
        require(msg.sender == owner, "Only contract owner can call this function");
        _;
    }
    
    // 仅在捐赠时间段内可调用的修饰符
    modifier validDonationTime() {
        require(
            block.timestamp >= donationStartTime && block.timestamp <= donationEndTime,
            "Donations are only allowed during the specified period"
        );
        _;
    }
    
    // 构造函数：初始化所有者和捐赠时间范围
    constructor(uint256 _startTime, uint256 _endTime) {
        require(_startTime < _endTime, "Start time must be before end time");
        owner = payable(msg.sender);
        donationStartTime = _startTime;
        donationEndTime = _endTime;
    }
    
    // 捐赠函数：接收以太币并记录捐赠信息
    function donate() external payable validDonationTime {
        require(msg.value > 0, "Donation amount must be greater than 0");
        
        // 更新捐赠金额映射
        donations[msg.sender] += msg.value;
        
        // 检查是否是新捐赠者
        bool isNewDonor = donations[msg.sender] == msg.value;
        
        if (isNewDonor) {
            // 新捐赠者 - 添加到结构体数组
            donors.push(Donor({
                donorAddress: msg.sender,
                donationAmount: msg.value
            }));
        } else {
            // 已有捐赠者 - 更新结构体数组中的金额
            for (uint256 i = 0; i < donors.length; i++) {
                if (donors[i].donorAddress == msg.sender) {
                    donors[i].donationAmount += msg.value;
                    break;
                }
            }
        }
        
        // 触发捐赠事件
        emit Donation(msg.sender, msg.value, block.timestamp);
    }
    
    // 提款函数：仅所有者可提取所有资金
    function withdraw() external onlyOwner {
        uint256 contractBalance = address(this).balance;
        require(contractBalance > 0, "No funds available to withdraw");
        owner.transfer(contractBalance);
    }
    
    // 查询指定地址的捐赠金额
    function getDonation(address _donor) external view returns (uint256) {
        return donations[_donor];
    }
    
    // 获取捐赠排行榜前n名 - 返回结构体数组
    function getTopDonors(uint256 _n) external view returns (Donor[] memory) {
        uint256 count = donors.length;
        uint256 resultCount = _n > count ? count : _n;
        
        // 复制结构体数组用于排序（不修改原始数据）
        Donor[] memory sortedDonors = new Donor[](count);
        for (uint256 i = 0; i < count; i++) {
            sortedDonors[i] = donors[i];
        }
        
        // 按捐赠金额降序排序
        for (uint256 i = 0; i < count; i++) {
            for (uint256 j = i + 1; j < count; j++) {
                if (sortedDonors[j].donationAmount > sortedDonors[i].donationAmount) {
                    // 交换结构体
                    Donor memory temp = sortedDonors[i];
                    sortedDonors[i] = sortedDonors[j];
                    sortedDonors[j] = temp;
                }
            }
        }
        
        // 截取前resultCount项作为结果
        Donor[] memory topDonors = new Donor[](resultCount);
        for (uint256 i = 0; i < resultCount; i++) {
            topDonors[i] = sortedDonors[i];
        }
        
        return topDonors;
    }
    
    // 接收直接转账的以太币，如address(contract).transfer(amount) 转账且不指定调用函数
    receive() external payable validDonationTime {
        // 处理直接向合约地址转账的情况
        donations[msg.sender] += msg.value;
        
        bool isNewDonor = donations[msg.sender] == msg.value;
        
        if (isNewDonor) {
            donors.push(Donor({
                donorAddress: msg.sender,
                donationAmount: msg.value
            }));
        } else {
            for (uint256 i = 0; i < donors.length; i++) {
                if (donors[i].donorAddress == msg.sender) {
                    donors[i].donationAmount += msg.value;
                    break;
                }
            }
        }
        
        emit Donation(msg.sender, msg.value, block.timestamp);
    }
}
