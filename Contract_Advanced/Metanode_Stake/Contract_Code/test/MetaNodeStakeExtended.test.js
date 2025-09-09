// 扩展测试文件，增加MetaNodeStake合约的测试覆盖率
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("MetaNodeStakeExtended", function () {
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
    const ADMIN_ROLE = await MetaNodeStake.ADMIN_ROLE();
    await MetaNodeStake.grantRole(ADMIN_ROLE, owner.address);

    // 向MetaNodeStake合约转账一些MetaNode代币作为奖励池
    await metaNode.transfer(MetaNodeStake.getAddress(), ethers.parseEther("10000"));

    // 添加ETH质押池
    await MetaNodeStake.addPool(
      ethers.ZeroAddress,
      100,
      100,
      100,
      true
    );
  });

  describe("合约暂停和恢复功能", function () {
    it("admin应该能够暂停和恢复提现功能", async function () {
      // 暂停提现
      await expect(MetaNodeStake.pauseWithdraw())
        .to.emit(MetaNodeStake, "PauseWithdraw");
      
      // 验证提现已暂停
      expect(await MetaNodeStake.withdrawPaused()).to.be.true;
      
      // 恢复提现
      await expect(MetaNodeStake.unpauseWithdraw())
        .to.emit(MetaNodeStake, "UnpauseWithdraw");
      
      // 验证提现已恢复
      expect(await MetaNodeStake.withdrawPaused()).to.be.false;
    });

    it("admin应该能够暂停和恢复领取奖励功能", async function () {
      // 暂停领取奖励
      await expect(MetaNodeStake.pauseClaim())
        .to.emit(MetaNodeStake, "PauseClaim");
      
      // 验证领取奖励已暂停
      expect(await MetaNodeStake.claimPaused()).to.be.true;
      
      // 恢复领取奖励
      await expect(MetaNodeStake.unpauseClaim())
        .to.emit(MetaNodeStake, "UnpauseClaim");
      
      // 验证领取奖励已恢复
      expect(await MetaNodeStake.claimPaused()).to.be.false;
    });

    it("非admin不应该能够暂停和恢复功能", async function () {
      // 尝试暂停提现
      await expect(
        MetaNodeStake.connect(addr1).pauseWithdraw()
      ).to.be.reverted;
      
      // 尝试暂停领取奖励
      await expect(
        MetaNodeStake.connect(addr1).pauseClaim()
      ).to.be.reverted;
    });
  });

  describe("更新区块参数功能", function () {
    it("admin应该能够更新开始区块和结束区块", async function () {
      const newStartBlock = 200;
      const newEndBlock = 99999999;
      
      // 更新开始区块
      await expect(MetaNodeStake.setStartBlock(newStartBlock))
        .to.emit(MetaNodeStake, "SetStartBlock")
        .withArgs(newStartBlock);
      
      // 验证开始区块已更新
      expect(await MetaNodeStake.startBlock()).to.equal(newStartBlock);
      
      // 更新结束区块
      await expect(MetaNodeStake.setEndBlock(newEndBlock))
        .to.emit(MetaNodeStake, "SetEndBlock")
        .withArgs(newEndBlock);
      
      // 验证结束区块已更新
      expect(await MetaNodeStake.endBlock()).to.equal(newEndBlock);
    });

    it("admin应该能够更新每区块奖励数量", async function () {
      const newMetaNodePerBlock = ethers.parseEther("5");
      
      // 更新每区块奖励数量
      await expect(MetaNodeStake.setMetaNodePerBlock(newMetaNodePerBlock))
        .to.emit(MetaNodeStake, "SetMetaNodePerBlock")
        .withArgs(newMetaNodePerBlock);
      
      // 验证每区块奖励数量已更新
      expect(await MetaNodeStake.MetaNodePerBlock()).to.equal(newMetaNodePerBlock);
    });
  });

  describe("查询函数测试", function () {
    beforeEach(async function () {
      // 质押一些ETH
      await MetaNodeStake.depositETH({
        value: ethers.parseEther("1")
      });
    });

    it("应该能够获取质押池数量", async function () {
      const poolLength = await MetaNodeStake.poolLength();
      expect(poolLength).to.equal(1);
    });

    it("应该能够获取用户质押余额", async function () {
      const stakingBalance = await MetaNodeStake.stakingBalance(0, owner.address);
      expect(stakingBalance.toString()).to.equal(ethers.parseEther("1").toString());
    });

    it("应该能够获取用户可提现金额", async function () {
      const [requestAmount, pendingWithdrawAmount] = await MetaNodeStake.withdrawAmount(0, owner.address);
      expect(requestAmount.toString()).to.equal("0");
      expect(pendingWithdrawAmount.toString()).to.equal("0");
    });

    it("应该能够获取待领取的MetaNode奖励", async function () {
      // 获取当前的区块号
      const initialBlock = await ethers.provider.getBlockNumber();
      
      // 增加区块数量，以便累积奖励
      const blocksToMine = 100;
      await ethers.provider.send("hardhat_mine", [ethers.toBeHex(blocksToMine)]); // 挖掘100个区块
      
      // 获取更新后的区块号
      const finalBlock = await ethers.provider.getBlockNumber();
      
      // 获取合约参数
      const metaNodePerBlock = await MetaNodeStake.MetaNodePerBlock();
      const poolInfo = await MetaNodeStake.pool(0);
      const poolWeight = BigInt(poolInfo.poolWeight);
      const totalPoolWeight = BigInt(await MetaNodeStake.totalPoolWeight());
      const userStakeAmount = BigInt(await MetaNodeStake.stakingBalance(0, owner.address));
      const stSupply = BigInt(poolInfo.stTokenAmount);
      const startBlock = await MetaNodeStake.startBlock();
      
      // 计算实际有效的区块数量（考虑startBlock和endBlock限制）
      let fromBlock = BigInt(poolInfo.lastRewardBlock);
      if (fromBlock < BigInt(startBlock)) {
        fromBlock = BigInt(startBlock);
      }
      const toBlock = BigInt(finalBlock);
      const effectiveBlocks = toBlock - fromBlock;
      
      // 计算奖励乘数
      const multiplier = effectiveBlocks * BigInt(metaNodePerBlock);
      
      // 计算该质押池可获得的奖励数量
      const metaNodeForPool = multiplier * poolWeight / totalPoolWeight;
      
      // 计算每个质押代币可获得的奖励数量
      const accMetaNodePerST = metaNodeForPool * BigInt(ethers.parseEther("1")) / stSupply;
      
      // 计算用户待领取的奖励数量
      const expectedReward = userStakeAmount * accMetaNodePerST / BigInt(ethers.parseEther("1"));
      
      // 获取实际待领取的MetaNode奖励
      const pendingMetaNode = await MetaNodeStake.pendingMetaNode(0, owner.address);
      
      // 验证奖励大于0
      expect(pendingMetaNode).to.be.gt(0);
      
      // 验证奖励计算的准确性（考虑浮点精度误差）
      const precision = ethers.parseEther("0.1"); // 允许0.1个MetaNode的误差
      expect(pendingMetaNode).to.be.closeTo(expectedReward, precision);
      
      console.log(`\n--- 奖励计算详情 ---`);
      console.log(`起始区块: ${initialBlock}`);
      console.log(`结束区块: ${finalBlock}`);
      console.log(`有效区块数: ${effectiveBlocks}`);
      console.log(`每区块奖励: ${ethers.formatEther(metaNodePerBlock)} MetaNode`);
      console.log(`池权重: ${poolWeight}`);
      console.log(`总权重: ${totalPoolWeight}`);
      console.log(`质押总量: ${ethers.formatEther(stSupply)} ETH`);
      console.log(`用户质押量: ${ethers.formatEther(userStakeAmount)} ETH`);
      console.log(`预期奖励: ${ethers.formatEther(expectedReward)} MetaNode`);
      console.log(`实际待领取奖励: ${ethers.formatEther(pendingMetaNode)} MetaNode`);
      console.log(`---------------------`);
    });
  });

  describe("unstake和withdraw功能", function () {
    beforeEach(async function () {
      // 质押一些ETH
      await MetaNodeStake.depositETH({
        value: ethers.parseEther("1")
      });
    });

    it("应该能够发起unstake请求", async function () {
      const unstakeAmount = ethers.parseEther("0.5");
      
      await expect(MetaNodeStake.unstake(0, unstakeAmount))
        .to.emit(MetaNodeStake, "RequestUnstake")
        .withArgs(owner.address, 0, unstakeAmount);
    });

    it("应该能够在解锁后withdraw", async function () {
      const unstakeAmount = ethers.parseEther("0.5");
      
      // 发起unstake请求
      await MetaNodeStake.unstake(0, unstakeAmount);
      
      // 增加区块数量，以便解锁
      await ethers.provider.send("hardhat_mine", ["0x65"]); // 挖掘101个区块
      
      // 执行withdraw
      await expect(MetaNodeStake.withdraw(0))
        .to.emit(MetaNodeStake, "Withdraw");
    });

    it("应该能够领取MetaNode奖励", async function () {
      // 增加区块数量，以便累积奖励
      await ethers.provider.send("hardhat_mine", ["0x64"]); // 挖掘100个区块
      
      // 保存领取前的余额
      const balanceBefore = await metaNode.balanceOf(owner.address);
      
      // 领取奖励
      await expect(MetaNodeStake.claim(0))
        .to.emit(MetaNodeStake, "Claim");
      
      // 验证余额增加
      const balanceAfter = await metaNode.balanceOf(owner.address);
      expect(balanceAfter).to.be.gt(balanceBefore);
    });
  });

  describe("多用户场景测试", function () {
    beforeEach(async function () {
      // 所有者质押一些ETH
      await MetaNodeStake.depositETH({
        value: ethers.parseEther("1")
      });
      
      // addr1也质押一些ETH
      await MetaNodeStake.connect(addr1).depositETH({
        value: ethers.parseEther("2")
      });
    });

    it("多个用户应该能够分别质押和领取奖励", async function () {
      // 增加区块数量，以便累积奖励
      await ethers.provider.send("hardhat_mine", ["0x64"]); // 挖掘100个区块
      
      // 所有者领取奖励
      await MetaNodeStake.claim(0);
      
      // addr1领取奖励
      await MetaNodeStake.connect(addr1).claim(0);
      
      // 验证两个用户都有MetaNode余额
      expect(await metaNode.balanceOf(owner.address)).to.be.gt(0);
      expect(await metaNode.balanceOf(addr1.address)).to.be.gt(0);
    });
  });
});