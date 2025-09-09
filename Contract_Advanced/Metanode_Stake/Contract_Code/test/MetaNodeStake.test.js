// Hardhat测试文件
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("MetaNodeStake", function () {
  let MetaNodeStake, metaNode, owner, addr1, addr2;

  beforeEach(async function () {
    // 获取测试账户
    [owner, addr1, addr2] = await ethers.getSigners();

    // 部署MetaNodeToken代币合约
    const MetaNodeFactory = await ethers.getContractFactory("MetaNodeToken");
    metaNode = await MetaNodeFactory.deploy();
    await metaNode.waitForDeployment(); // 等待部署完成

    // 部署MetaNodeStake质押合约
    const MetaNodeStakeFactory = await ethers.getContractFactory("MetaNodeStake");
    MetaNodeStake = await MetaNodeStakeFactory.deploy();
    await MetaNodeStake.waitForDeployment(); // 等待部署完成

    // 初始化MetaNodeStake合约
    await MetaNodeStake.initialize(
      metaNode.getAddress(), // 使用getAddress()获取地址
      100, // startBlock
      100000000, // endBlock
      ethers.parseEther("3") // MetaNodePerBlock (3 MetaNode)
    );

    // 授予admin角色给owner
    const ADMIN_ROLE = await MetaNodeStake.ADMIN_ROLE();
    await MetaNodeStake.grantRole(ADMIN_ROLE, owner.address);

    // 向MetaNodeStake合约转账一些MetaNode代币作为奖励池
    await metaNode.transfer(MetaNodeStake.getAddress(), ethers.parseEther("10000"));
  });

  describe("初始化和角色", function () {
    it("应该正确设置初始参数", async function () {
      // 检查startBlock, endBlock和MetaNodePerBlock是否正确设置
      expect(await MetaNodeStake.startBlock()).to.equal(100);
      expect(await MetaNodeStake.endBlock()).to.equal(100000000);
      // 使用BigNumber比较
      expect(await MetaNodeStake.MetaNodePerBlock()).to.equal(ethers.parseEther("3"));
    });

    it("owner应该具有admin角色", async function () {
      const ADMIN_ROLE = await MetaNodeStake.ADMIN_ROLE();
      expect(await MetaNodeStake.hasRole(ADMIN_ROLE, owner.address)).to.be.true;
    });
  });

  describe("添加质押池", function () {
    it("admin应该能够添加新的质押池", async function () {
      // 添加原生货币池
      const stTokenAddress = ethers.ZeroAddress; // 0x0表示原生货币
      const poolWeight = 100;
      const minDepositAmount = 100;
      const withdrawLockedBlocks = 100;
      const withUpdate = true;

      await expect(MetaNodeStake.addPool(
        stTokenAddress,
        poolWeight,
        minDepositAmount,
        withdrawLockedBlocks,
        withUpdate
      )).to.emit(MetaNodeStake, "AddPool");

      // 验证池信息是否正确设置
      const poolInfo = await MetaNodeStake.pool(0);
      expect(poolInfo.stTokenAddress).to.equal(stTokenAddress);
      expect(poolInfo.minDepositAmount.toString()).to.equal(minDepositAmount.toString());
      expect(poolInfo.unstakeLockedBlocks.toString()).to.equal(withdrawLockedBlocks.toString());
    });

    it("非admin不应该能够添加质押池", async function () {
      const stTokenAddress = ethers.ZeroAddress;
      const poolWeight = 100;
      const minDepositAmount = 100;
      const withdrawLockedBlocks = 100;
      const withUpdate = true;

      await expect(
        MetaNodeStake.connect(addr1).addPool(
          stTokenAddress,
          poolWeight,
          minDepositAmount,
          withdrawLockedBlocks,
          withUpdate
        )
      ).to.be.reverted;
    });
  });

  describe("质押功能", function () {
    beforeEach(async function () {
      // 先添加一个质押池
      await MetaNodeStake.addPool(
        ethers.ZeroAddress,
        100,
        100,
        100,
        true
      );
    });

    it("应该能够质押原生货币", async function () {
      const depositAmount = ethers.parseEther("1");

      await expect(
        // 默认调用者是owner，可使用connect指定不同的调用者
        MetaNodeStake.depositETH({ value: depositAmount })
      ).to.emit(MetaNodeStake, "Deposit");

      // 验证用户的质押信息
      const userInfo = await MetaNodeStake.user(0, owner.address);
      expect(userInfo.stAmount.toString()).to.equal(depositAmount.toString());

      // 验证池中的总质押量
      const poolInfo = await MetaNodeStake.pool(0);
      expect(poolInfo.stTokenAmount.toString()).to.equal(depositAmount.toString());
    });

    it("质押金额应该大于等于最小质押金额", async function () {
      const poolInfo = await MetaNodeStake.pool(0);
      const minDepositAmount = poolInfo.minDepositAmount;
      console.log("minDepositAmount:", minDepositAmount.toString());
      
      // 尝试使用一个明确小于最小质押金额的值
      const depositAmount = ethers.parseEther("0.000000000000000099"); // 99 wei，肯定小于100 wei
      console.log("depositAmount:", depositAmount.toString());

      await expect(
        MetaNodeStake.depositETH({ value: depositAmount })
      ).to.be.revertedWith("deposit amount is too small");
    });
  });

  describe("更新质押池", function () {
    beforeEach(async function () {
      // 先添加一个质押池
      await MetaNodeStake.addPool(
        ethers.ZeroAddress,
        100,
        100,
        100,
        true
      );
    });

    it("admin应该能够更新质押池权重", async function () {
      const newPoolWeight = 200;
      const withUpdate = true;

      await expect(MetaNodeStake.setPoolWeight(0, newPoolWeight, withUpdate))
        .to.emit(MetaNodeStake, "SetPoolWeight")
        .withArgs(0, newPoolWeight, newPoolWeight);

      // 验证池权重是否已更新
      const poolInfo = await MetaNodeStake.pool(0);
      expect(poolInfo.poolWeight.toString()).to.equal(newPoolWeight.toString());
    });

    it("admin应该能够更新池信息", async function () {
      const newMinDepositAmount = 200;
      const newWithdrawLockedBlocks = 200;

      await expect(MetaNodeStake.updatePool(0, newMinDepositAmount, newWithdrawLockedBlocks))
        .to.emit(MetaNodeStake, "UpdatePoolInfo")
        .withArgs(0, newMinDepositAmount, newWithdrawLockedBlocks);

      // 验证池信息是否已更新
      const poolInfo = await MetaNodeStake.pool(0);
      expect(poolInfo.minDepositAmount.toString()).to.equal(newMinDepositAmount.toString());
      expect(poolInfo.unstakeLockedBlocks.toString()).to.equal(newWithdrawLockedBlocks.toString());
    });
  });
});