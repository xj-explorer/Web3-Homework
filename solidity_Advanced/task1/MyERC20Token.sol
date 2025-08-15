// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract MyERC20Token {
    // 代币名称
    string public name;
    // 代币符号
    string public symbal;
    // 代币精度
    uint8 public decimals;
    // 代币总供应量
    uint256 public totalSupply;

    // 账户余额
    mapping(address => uint256) private _balances;
    // 账户授权额度，授权者owner => 被授权者spender => 被授权额度（被授权者被授权一定的权限额度去使用授权者自己的代币）
    mapping(address => mapping(address => uint256) ) private _allowances;
    
    // 合约所有者
    address private _owner;

    // 转账事件日志
    event Transfer(address indexed from, address indexed to, uint256 amount);
     // 授权事件日志
    event Approval(address indexed owner, address indexed spender, uint256 amount);

    modifier onlyOwner() {
        require(_owner == msg.sender, "Caller is not owner!");
        _;
    }

    constructor(string memory _name, string memory _symbal, uint8 _decimals, uint256 _totalSupply) {
        name = _name;
        symbal = _symbal;
        decimals = _decimals;
        _owner = msg.sender;
        mint(msg.sender, _totalSupply * (10 ** decimals));
    }

    function mint(address account, uint256 amount) public onlyOwner {
        require(account != address(0), "Can't mint to the zero address");
        require(amount > 0, "amount should be large than 0");

        totalSupply += amount;
        _balances[account] += amount;

        emit Transfer(address(0), account, amount);
    }

    function balanceOf(address account) public view returns(uint256) {
        return _balances[account];
    }

    function transfer(address recipient, uint256 amount) public returns(bool) {
        require(recipient != address(0), "Recipient should not be zero address");
        require(_balances[msg.sender] >= amount, "Insufficient balance");
        _balances[msg.sender] -= amount;
        _balances[recipient] += amount;

        emit Transfer(msg.sender, recipient, amount);
        return true;
    }

    function approve(address spender, uint256 amount) public returns(bool) {
        require(spender != address(0), "Spender should't be zero address");
        require(_balances[msg.sender] >= amount, "Insufficient balance");
        _allowances[msg.sender][spender] = amount;

        emit Approval(msg.sender, spender, amount);
        return true;
    }

    function allowance(address owner, address spender) public view returns(uint256) {
        return _allowances[owner][spender];
    }

    function transferFrom(address sender, address recipient, uint256 amount) public returns(bool) {
        require(sender != address(0), "Sender should't be zero address");
        require(recipient != address(0), "Recipient should't be zero address");
        require(_allowances[sender][msg.sender] >= amount, "Allowance exceeded");
        require(_balances[sender] >= amount, "Insufficient balance");

        _balances[sender] -= amount;
        _balances[recipient] += amount;
        _allowances[sender][msg.sender] -= amount;

        emit Transfer(sender, recipient, amount);
        return true;
    }


}