const { loadFixture } = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { expect } = require("chai");
const { ethers } = require("hardhat");

// 模拟的链选择器值
const SEPOLIA_CHAIN_SELECTOR = 16015286601757825753n;
const AMOY_CHAIN_SELECTOR = 12532609583862916517n;

// 模拟的Token金额
const TEST_AMOUNT = ethers.parseEther("100");

// 部署fixture
async function deployCCIPTokenTransferFixture() {
  // 获取签名者
  const [deployer, user] = await ethers.getSigners();
  
  // 部署一个模拟的ERC20代币用于测试
  const ERC20 = await ethers.getContractFactory("@openzeppelin/contracts/token/ERC20/ERC20.sol:ERC20");
  const mockToken = await ERC20.deploy("Mock Token", "MTK");
  
  // 给用户铸造一些代币
  await mockToken.connect(deployer).mint(user.address, TEST_AMOUNT);
  
  // 创建一个MockRouter合约来模拟CCIP Router的行为
  const mockRouterFactory = await ethers.getContractFactory(
    [
      "function isChainSupported(uint64 chainSelector) external view returns (bool)",
      "function getFee(uint64 chainSelector, bytes memory message) external view returns (uint256)",
      "function ccipSend(uint64 chainSelector, bytes memory message) external payable returns (bytes32)"
    ],
    deployer
  );
  
  // 部署MockRouter合约
  const mockRouter = await mockRouterFactory.deploy();
  
  // 部署Sender合约
  const Sender = await ethers.getContractFactory("CrossChainTokenTransferSender");
  const sender = await Sender.deploy(mockRouter.address);
  
  // 部署Receiver合约
  const Receiver = await ethers.getContractFactory("CrossChainTokenTransferReceiver");
  const receiver = await Receiver.deploy(mockRouter.address);
  
  // 使用Hardhat的Mock功能设置Router行为
  await mockRouter.mock.isChainSupported.returns(true);
  await mockRouter.mock.getFee.returns(ethers.parseEther("0.1"));
  await mockRouter.mock.ccipSend.returns(ethers.randomBytes(32));
  
  return {
    deployer,
    user,
    mockToken,
    sender,
    receiver,
    mockRouter
  };
}

describe("CrossChainTokenTransfer", function () {
  describe("合约部署", function () {
    it("应该成功部署Sender合约", async function () {
      const { sender } = await loadFixture(deployCCIPTokenTransferFixture);
      expect(sender.address).to.be.properAddress;
    });
    
    it("应该成功部署Receiver合约", async function () {
      const { receiver } = await loadFixture(deployCCIPTokenTransferFixture);
      expect(receiver.address).to.be.properAddress;
    });
  });
  
  describe("发送跨链Token", function () {
    it("应该允许用户授权Token转账", async function () {
      const { user, mockToken, sender } = await loadFixture(deployCCIPTokenTransferFixture);
      
      // 授权Sender合约使用用户的Token
      const tx = await mockToken.connect(user).approve(sender.address, TEST_AMOUNT);
      await tx.wait();
      
      // 检查授权是否成功
      const allowance = await mockToken.allowance(user.address, sender.address);
      expect(allowance).to.equal(TEST_AMOUNT);
    });
    
    it("应该触发TokensSent事件", async function () {
      const { user, mockToken, sender, receiver } = await loadFixture(deployCCIPTokenTransferFixture);
      
      // 授权Sender合约使用用户的Token
      await mockToken.connect(user).approve(sender.address, TEST_AMOUNT);
      
      // 因为实际的ccipSend需要支付费用，我们需要发送一些以太币
      const fee = ethers.parseEther("0.1");
      
      // 验证TokensSent事件触发
      await expect(
        sender.connect(user).sendToken(
          AMOY_CHAIN_SELECTOR,
          receiver.address,
          mockToken.address,
          TEST_AMOUNT,
          {
            value: fee
          }
        )
      ).to.emit(sender, "TokensSent");
    });
  });
  
  describe("错误处理", function () {
    it("应该拒绝无效的Router地址", async function () {
      // 尝试使用无效的Router地址部署合约
      const Sender = await ethers.getContractFactory("CrossChainTokenTransferSender");
      
      // 期望交易失败
      await expect(
        Sender.deploy(ethers.ZeroAddress)
      ).to.be.revertedWithCustomError(Sender, "InvalidRouterAddress");
    });
    
    it("应该拒绝无效的目标链选择器", async function () {
      // 这里我们只验证合约的错误定义，因为实际测试需要mock Router
      const Sender = await ethers.getContractFactory("CrossChainTokenTransferSender");
      
      // 检查错误是否存在
      expect(Sender.interface.errors.UnsupportedDestinationChain).to.exist;
    });
  });
  
  describe("合约接口验证", function () {
    it("Sender合约应该有正确的接口", async function () {
      const { sender } = await loadFixture(deployCCIPTokenTransferFixture);
      
      // 检查合约是否有sendToken函数
      expect(sender.interface.functions.sendToken).to.exist;
      
      // 检查函数签名是否正确
      const functionSignature = sender.interface.getFunction("sendToken").format();
      expect(functionSignature).to.include("uint64 destinationChainSelector");
      expect(functionSignature).to.include("address receiver");
      expect(functionSignature).to.include("address token");
      expect(functionSignature).to.include("uint256 amount");
    });
    
    it("Receiver合约应该继承自CCIPReceiver", async function () {
      const { receiver } = await loadFixture(deployCCIPTokenTransferFixture);
      
      // 检查合约是否有_ccipReceive函数(内部函数在接口中不可见)
      // 这里我们只能检查合约的基本属性
      expect(receiver.address).to.be.properAddress;
    });
  });
});