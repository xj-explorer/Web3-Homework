// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Voting {
    address public owner;
    struct Candidate {
        address candidateName;
        uint votes;
    }
    Candidate[] private allCandidates;
    mapping(address => address[]) public candicateInfo;

    constructor() {
        // 部署合约时初始化合约所有者(即部署合约的账户地址)
        owner = msg.sender;
    }

    // 自定义修饰符，仅合约所有者可操作
    modifier onlyOwner {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }

    // 投票
    function vote(address user) public returns(bool) {
        uint voterLen = candicateInfo[user].length;
        for(uint i=0; i<voterLen; i++) {
            if(candicateInfo[user][i] == msg.sender) {
                revert("You have voted");
            }
        }
        candicateInfo[user].push(msg.sender);
        for(uint i=0; i<allCandidates.length; i++) {
            if(allCandidates[i].candidateName == user) {
                allCandidates[i].votes++;
                return true;
            }
        }
        allCandidates.push(Candidate(user, candicateInfo[user].length));
        return true;
    }

    // 获取指定候选者的票数
    function getCandidateVotes(address user) public view returns(uint) {
        return candicateInfo[user].length;
    }

    // 获取所有候选者及其票数
    function getAllCandidates() public view returns(Candidate[] memory) {
        return allCandidates;
    }

    // 重置所有候选者的票数
    function resetCandidatesVotes() public onlyOwner returns(bool, string memory) {
        uint256 len = allCandidates.length;
        for(uint i=0; i<len; i++) {
            address candidate = allCandidates[i].candidateName;
            // 数组重置为空数组
            delete candicateInfo[candidate];
            allCandidates[i].votes = 0;
        }
        return (true, "Reset success");
    }
}