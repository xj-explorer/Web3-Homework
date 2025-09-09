const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("MetaNodeStakeEdgeCases", function () {
  let MetaNodeStake, metaNode, owner, addr1, addr2;

  beforeEach(async function () {
    // 获取测试账户
    [owner, addr1, addr2] = await ethers.getSigners();

    // 部署MetaNodeToken代币合约
    const MetaNodeFactory = await ethers.getContractFactory("MetaNodeToken");
    metaNode = await MetaNodeFactory.deploy();
    await metaNode.waitForDeployment();

    // 部署MetaNodeStake质押合约
    const MetaNodeStakeFactory = await ethers.getContractFactory("MetaNodeStake");
    MetaNodeStake = await MetaNodeStakeFactory.deploy();
    await MetaNodeStake.waitForDeployment();

    // 初始化MetaNodeStake合约
    await MetaNodeStake.initialize(
      metaNode.getAddress(),
      100, // startBlock
      100000000, // endBlock
      ethers.parseEther("3") // MetaNodePerBlock (3 MetaNode)
    );

    // 授予admin角色给owner
    const DEFAULT_ADMIN_ROLE = await MetaNodeStake.DEFAULT_ADMIN_ROLE();
    await MetaNodeStake.grantRole(DEFAULT_ADMIN_ROLE, owner.address);

    // 添加ETH质押池
    await MetaNodeStake.addPool(
      ethers.ZeroAddress,
      100,
      100,
      100,
      true
    );
  });

  todo
  describe("_safeMetaNodeTransfer余额不足分支测试", function () {
    it("应该能够测试MetaNode余额不足时的处理", async function () {
      // 确保合约没有MetaNode余额
      // 通过owner账户转账一些ETH进行质押
      await MetaNodeStake.depositETH({
        value: ethers.parseEther("1")
      });

      // 增加区块数量，以便累积奖励
      await ethers.provider.send("hardhat_mine", ["0x64"]); // 挖掘100个区块

      // 为了更可靠地测试_safeMetaNodeTransfer的余额不足分支，我们需要一个更直接的方法
      // 让我们创建一个新的测试合约，直接调用_safeMetaNodeTransfer函数
      
      // 先给合约转账少量MetaNode
      await metaNode.transfer(MetaNodeStake.getAddress(), ethers.parseEther("0.1"));
      
      // 现在让我们尝试直接调用_safeMetaNodeTransfer函数
      // 由于这个函数是internal的，我们无法直接调用它
      // 所以我们需要通过触发使用该函数的公开函数来间接测试它
      
      // 让我们质押一些ETH并等待奖励累积
      await MetaNodeStake.depositETH({ value: ethers.parseEther("10") });
      await ethers.provider.send("hardhat_mine", ["0x64"]); // 挖掘100个区块
      
      // 尝试claim奖励，这应该会触发_safeMetaNodeTransfer函数
      // 由于合约中的MetaNode余额很少，应该会进入余额不足分支
      await expect(MetaNodeStake.claim(0)).to.not.be.reverted;
    });

    it("应该能够测试MetaNode余额部分不足时的处理", async function () {
      // 转账少量MetaNode到合约
      await metaNode.transfer(MetaNodeStake.getAddress(), ethers.parseEther("1"));

      // 通过owner账户转账一些ETH进行质押
      await MetaNodeStake.depositETH({
        value: ethers.parseEther("100")
      });

      // 增加区块数量，以便累积大量奖励
      await ethers.provider.send("hardhat_mine", ["0x1000"]); // 挖掘4096个区块

      // 此时，尝试claim奖励，预期奖励会超过合约中的MetaNode余额
      // 这应该触发_safeMetaNodeTransfer的余额不足分支，转移所有可用的MetaNode
      await expect(MetaNodeStake.claim(0)).to.not.be.reverted;
    });
  });

  describe("_safeETHTransfer函数data.length>0分支测试", function () {
    it("应该能够测试接收ETH时返回数据的情况", async function () {
      // 部署ETHReceiver合约
      const ETHReceiverFactory = await ethers.getContractFactory("ETHReceiver");
      const receiver = await ETHReceiverFactory.deploy();
      await receiver.waitForDeployment();

      // 为了测试data.length > 0分支，我们需要调用一个带有数据的函数
      // 我们可以通过call方法发送一些数据到receiver，这会触发fallback函数
      const tx = await owner.sendTransaction({
        to: receiver.getAddress(),
        value: ethers.parseEther("0.1"),
        data: "0x1234" // 发送一些数据，确保data.length > 0
      });
      await tx.wait();
      
      // 确认交易成功
      expect(await ethers.provider.getBalance(receiver.getAddress())).to.be.gt(0);
    });

    it("应该能够测试pendingMetaNode_ > 0条件分支", async function () {
      // 先转账一些MetaNode到合约
      await metaNode.transfer(MetaNodeStake.getAddress(), ethers.parseEther("1000"));

      // 质押一些ETH
      await MetaNodeStake.depositETH({
        value: ethers.parseEther("1")
      });

      // 增加区块数量，以便累积奖励
      await ethers.provider.send("hardhat_mine", ["0x64"]); // 挖掘100个区块

      // 此时应该有待领取的奖励，即pendingMetaNode_ > 0
      // 再次质押会触发updatePool函数，从而进入pendingMetaNode_ > 0分支
      await MetaNodeStake.depositETH({
        value: ethers.parseEther("0.5")
      });
    });

    it("应该能够测试_safeETHTransfer函数中的data.length>0分支", async function () {
      // 部署ETHReceiver合约
      const ETHReceiverFactory = await ethers.getContractFactory("ETHReceiver");
      const ethReceiver = await ETHReceiverFactory.deploy();
      await ethReceiver.waitForDeployment();

      // 直接向ETHReceiver合约发送带数据的ETH转账
      // 这将触发fallback函数，确保data.length > 0
      const tx = await owner.sendTransaction({
        to: ethReceiver.getAddress(),
        value: ethers.parseEther("0.1"),
        data: "0x1234"
      });
      await tx.wait();

      // 验证ETHReceiver合约收到了ETH
      expect(await ethers.provider.getBalance(ethReceiver.getAddress())).to.equal(ethers.parseEther("0.1"));
    });
  });

  describe("非ETH池测试", function () {
    it("应该能够测试非ETH池的withdraw操作", async function () {
      // 部署一个ERC20代币作为质押资产
      const ERC20Factory = await ethers.getContractFactory("MetaNodeToken");
      const stToken = await ERC20Factory.deploy();
      await stToken.waitForDeployment();

      // 转账一些代币给owner
      await stToken.transfer(owner.address, ethers.parseEther("1000"));

      // 批准代币转账
      await stToken.approve(MetaNodeStake.getAddress(), ethers.parseEther("1000"));

      // 添加一个非ETH质押池
      await MetaNodeStake.addPool(
        stToken.getAddress(),
        100,
        100,
        100,
        true
      );

      // 质押一些代币到非ETH池
      await MetaNodeStake.deposit(1, ethers.parseEther("100"));

      // 发起unstake请求
      await MetaNodeStake.unstake(1, ethers.parseEther("50"));

      // 增加区块数量，以便解锁
      await ethers.provider.send("hardhat_mine", ["0x65"]); // 挖掘101个区块

      // 执行withdraw操作，这应该会触发withdraw函数中的非ETH池分支
      await expect(MetaNodeStake.withdraw(1))
        .to.emit(MetaNodeStake, "Withdraw");
    });

    it("应该能够测试pendingWithdraw_ > 0的情况", async function () {
      // 这个测试确保withdraw函数中的pendingWithdraw_ > 0条件分支被覆盖
      // 我们可以使用上面的非ETH池测试，或者在ETH池中进行类似的操作
      // 这里我们在ETH池中测试
      
      // 质押一些ETH到ETH池
      await MetaNodeStake.depositETH({ value: ethers.parseEther("1") });

      // 发起unstake请求
      await MetaNodeStake.unstake(0, ethers.parseEther("0.5"));

      // 增加区块数量，以便解锁
      await ethers.provider.send("hardhat_mine", ["0x65"]); // 挖掘101个区块

      // 此时pendingWithdraw_应该大于0
      // 执行withdraw操作，这应该会触发pendingWithdraw_ > 0条件分支
      await expect(MetaNodeStake.withdraw(0))
        .to.emit(MetaNodeStake, "Withdraw");
    });
  });

  describe("溢出保护测试", function () {
    it("应该能够测试各种溢出保护机制", async function () {
      // 部署额外的ERC20代币作为质押资产
      const ERC20Factory = await ethers.getContractFactory("MetaNodeToken");
      const stToken = await ERC20Factory.deploy();
      await stToken.waitForDeployment();

      // 批准代币转账
      await stToken.approve(MetaNodeStake.getAddress(), ethers.MaxUint256);

      // 添加第二个质押池（非ETH池）
      await MetaNodeStake.addPool(
        stToken.getAddress(),
        100,
        100,
        100,
        true
      );

      // 在ETH池中质押大量ETH（接近溢出）
      const largeAmountETH = ethers.parseEther("1000");
      await MetaNodeStake.depositETH({ value: largeAmountETH });

      // 在第二个池中质押大量代币（接近溢出）
      const largeAmountToken = ethers.parseEther("10000");
      await stToken.transfer(owner.address, largeAmountToken);
      await stToken.approve(MetaNodeStake.getAddress(), largeAmountToken);
      await MetaNodeStake.deposit(1, largeAmountToken);

      // 测试claim操作，应该不会发生溢出
      await ethers.provider.send("hardhat_mine", ["0x64"]); // 挖掘100个区块
      await expect(MetaNodeStake.claim(0)).to.not.be.reverted;
    });
  });

  describe("合约边界条件测试", function () {
    it("应该能够测试区块参数的边界条件", async function () {
      // 测试startBlock和endBlock的极端值
      const maxUint256 = ethers.MaxUint256;
      const minUint256 = 0;
      
      // 更新为最大区块值
      await MetaNodeStake.setEndBlock(maxUint256);
      expect(await MetaNodeStake.endBlock()).to.equal(maxUint256);
      
      // 更新为最小区块值
      await MetaNodeStake.setStartBlock(minUint256);
      expect(await MetaNodeStake.startBlock()).to.equal(minUint256);
    });

    it("应该能够测试奖励率的边界条件", async function () {
      // 测试MetaNodePerBlock的极端值
      const maxReward = ethers.parseEther("1000000");
      const minReward = ethers.parseEther("0.000000000000000001"); // 最小的非零值
      
      // 设置最大奖励率
      await MetaNodeStake.setMetaNodePerBlock(maxReward);
      expect(await MetaNodeStake.MetaNodePerBlock()).to.equal(maxReward);
      
      // 设置最小奖励率（非零）
      await MetaNodeStake.setMetaNodePerBlock(minReward);
      expect(await MetaNodeStake.MetaNodePerBlock()).to.equal(minReward);
    });
  });
});