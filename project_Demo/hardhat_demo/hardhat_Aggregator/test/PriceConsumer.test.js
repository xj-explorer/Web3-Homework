// PriceConsumer合约测试脚本
const { ethers } = require('hardhat');
const { expect } = require('chai');

describe('PriceConsumer合约测试', function () {
  let priceConsumer, deployer;
  
  // 设置测试超时时间
  this.timeout(60000);

  beforeEach(async function () {
    // 获取部署者账户
    [deployer] = await ethers.getSigners();
    
    // 使用一个随机地址作为模拟价格Feed地址
    // 注意：在本地测试中，我们不会实际调用这个地址上的合约
    const mockPriceFeedAddress = '0x1234567890123456789012345678901234567890';
    
    // 创建PriceConsumer合约
    const PriceConsumer = await ethers.getContractFactory('PriceConsumer');
    priceConsumer = await PriceConsumer.deploy(mockPriceFeedAddress);
    await priceConsumer.waitForDeployment();
  })

  // 简单模拟价格Feed的行为，避免在本地测试中调用真实合约
  beforeEach(async function () {
    // 模拟Chainlink价格Feed的调用
    // 注意：在真实环境中，这些调用会直接与Chainlink合约交互
  });

  describe('合约部署', function () {
    it('应该正确部署并初始化', async function () {
      const contractAddress = await priceConsumer.getAddress();
      expect(contractAddress).to.not.be.undefined;
      expect(contractAddress).to.not.equal('0x0000000000000000000000000000000000000000');
    });
  });

  describe('价格阈值功能', function () {
    it('应该能够设置价格阈值', async function () {
      const threshold = ethers.parseUnits('2100', 8);
      const tx = await priceConsumer.setPriceThreshold(threshold);
      const receipt = await tx.wait();
      
      // 检查是否触发了PriceThresholdSet事件
      const thresholdSetEvent = receipt.logs.find(log => 
        log.topics[0] === ethers.id('PriceThresholdSet(uint256)')
      );
      expect(thresholdSetEvent).to.not.be.undefined;
      
      // 检查阈值是否正确设置
      const storedThreshold = await priceConsumer.priceThreshold();
      expect(storedThreshold).to.equal(threshold);
    });
  });
});