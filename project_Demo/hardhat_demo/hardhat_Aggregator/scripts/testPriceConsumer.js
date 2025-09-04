// 测试已部署的PriceConsumer合约功能的脚本
const { ethers } = require('hardhat');
require('dotenv').config();

async function main() {
  console.log('===== 开始测试已部署的PriceConsumer合约 =====\n');

  // 使用Hardhat提供的Signer（自动连接到指定网络）
  const [deployer] = await ethers.getSigners();
  console.log('使用账户进行测试:', deployer.address);

  // 获取账户余额
  const balance = await deployer.provider.getBalance(deployer.address);
  console.log('账户余额:', ethers.formatEther(balance), 'ETH\n');

  // 合约地址 - 替换为您实际部署的合约地址
  // 如果环境变量中没有提供，则使用默认值
  const contractAddress = process.env.PRICE_CONSUMER_ADDRESS || '0xcd0466e19bc2Dde5b1EabcA7f4Ba3cCCcF0169e7';
  console.log('测试合约地址:', contractAddress);

  // 合约ABI（简化版，只包含需要测试的函数）
  // 注意：事件定义必须与实际合约完全匹配，特别是indexed关键字的使用
  const abi = [
    'function getLatestPrice() external returns (uint256)',
    'function setPriceThreshold(uint256 _threshold) external',
    'function checkPriceThreshold() external',
    'function getDecimals() external view returns (uint8)',
    'function getDescription() external view returns (string memory)',
    'function getLatestRoundData() external view returns (uint80, int256, uint256, uint256, uint80)',
    'function priceThreshold() external view returns (uint256)',
    'function lastPrice() external view returns (uint256)',
    'function lastPriceTimestamp() external view returns (uint256)',
    // 移除了所有indexed关键字，使其与合约定义完全匹配
    'event PriceUpdated(uint256 price, uint256 timestamp)',
    'event PriceThresholdSet(uint256 threshold)',
    'event PriceThresholdExceeded(uint256 currentPrice, uint256 threshold)',
    'event PriceThresholdBelow(uint256 currentPrice, uint256 threshold)'
  ];

  // 使用Hardhat的getContractAt创建合约实例
  const priceConsumer = new ethers.Contract(contractAddress, abi, deployer);
  console.log('已创建合约实例\n');

  // 测试1: 获取价格Feed的基本信息
  console.log('===== 测试1: 获取价格Feed的基本信息 =====');
  try {
    // 获取小数位数并显式转换为普通数字
    const decimalsResult = await priceConsumer.getDecimals();
    const decimals = parseInt(decimalsResult.toString());
    console.log('价格Feed小数位数:', decimals);

    const description = await priceConsumer.getDescription();
    console.log('价格Feed描述:', description);

    // 获取最新回合数据并处理BigInt类型
    const latestRoundData = await priceConsumer.getLatestRoundData();
    console.log('最新回合数据:');
    console.log('  回合ID:', latestRoundData[0].toString());
    
    // 显式转换BigInt值以避免类型错误
    const price = ethers.formatUnits(BigInt(latestRoundData[1]), decimals);
    console.log('  价格:', price, 'USD');
    
    // 对于时间戳也需要显式转换
    try {
      const startTime = parseInt(latestRoundData[2].toString());
      const updateTime = parseInt(latestRoundData[3].toString());
      console.log('  开始时间:', startTime > 0 ? new Date(startTime * 1000).toLocaleString() : '未知');
      console.log('  更新时间:', updateTime > 0 ? new Date(updateTime * 1000).toLocaleString() : '未知');
    } catch (timeError) {
      console.log('  时间数据解析错误:', timeError.message);
    }
  } catch (error) {
    console.error('获取价格Feed信息失败:', error.message);
    console.error('错误详情:', error);
  }
  console.log('\n');

  // 测试2: 设置价格阈值
  console.log('===== 测试2: 设置价格阈值 =====');
  try {
    // 设置一个测试阈值（2000 USD），使用 ethers.parseUnits 将字符串形式的数值转换为指定小数位数（8位）的数值
    // 由于链上交易通常使用整数处理金额，因此需要将实际的价格转换为整数形式
    const threshold = ethers.parseUnits('2000', 8);
    // 打印设置的价格阈值，使用 ethers.formatUnits 将链上的整数形式数值转换为可读的价格格式
    console.log('设置价格阈值:', ethers.formatUnits(threshold, 8), 'USD');
    
    // 发送设置阈值的交易
    const tx = await priceConsumer.setPriceThreshold(threshold);
    console.log('设置阈值交易哈希:', tx.hash);
    
    // 等待交易确认
    await tx.wait();
    console.log('价格阈值已成功设置\n');
    
    // 验证阈值是否正确设置
    const storedThreshold = await priceConsumer.priceThreshold();
    console.log('验证存储的阈值:', ethers.formatUnits(storedThreshold, 8), 'USD');
  } catch (error) {
    console.error('设置价格阈值失败:', error.message);
  }
  console.log('\n');

  // 测试3: 获取最新价格并触发阈值检查
  console.log('===== 测试3: 获取最新价格并触发阈值检查 =====');
  try {
    console.log('调用getLatestPrice()获取最新价格...');
    const tx = await priceConsumer.getLatestPrice();
    console.log('获取价格交易哈希:', tx.hash);
    
    // 等待交易确认
    const receipt = await tx.wait();
    console.log('价格获取成功，正在解析事件...\n');
    
    // 解析交易中的事件
    console.log('交易事件日志:');
    
    // 检查日志数组是否为空
    if (receipt.logs.length === 0) {
      console.log('  没有找到事件日志');
    } else {
      // 遍历并尝试解析每个日志条目
      let foundEvents = false;
      for (let index = 0; index < receipt.logs.length; index++) {
        const log = receipt.logs[index];
        try {
          // 尝试解析事件
          const event = priceConsumer.interface.parseLog(log);
          if (event) {
            foundEvents = true;
            console.log(`  事件${index + 1}:`, event.name);
            
            if (event.name === 'PriceUpdated') {
              // 显式转换BigInt值以避免类型错误
              const price = ethers.formatUnits(BigInt(event.args[0]), 8);
              const timestamp = parseInt(event.args[1].toString());
              console.log(`    价格: ${price} USD`);
              console.log(`    时间戳: ${new Date(timestamp * 1000).toLocaleString()}`);
            } else if (event.name === 'PriceThresholdExceeded') {
              const currentPrice = ethers.formatUnits(BigInt(event.args[0]), 8);
              const threshold = ethers.formatUnits(BigInt(event.args[1]), 8);
              console.log(`    当前价格: ${currentPrice} USD`);
              console.log(`    阈值: ${threshold} USD`);
              console.log('    状态: 价格超过阈值');
            } else if (event.name === 'PriceThresholdBelow') {
              const currentPrice = ethers.formatUnits(BigInt(event.args[0]), 8);
              const threshold = ethers.formatUnits(BigInt(event.args[1]), 8);
              console.log(`    当前价格: ${currentPrice} USD`);
              console.log(`    阈值: ${threshold} USD`);
              console.log('    状态: 价格低于阈值');
            } else {
              console.log('    参数:', event.args);
            }
          }
        } catch (e) {
          // 记录解析错误但继续处理其他日志
          console.log(`  日志${index + 1}: 无法解析（非此合约事件或格式不匹配）`);
        }
      }
      
      if (!foundEvents) {
        console.log('  没有找到可解析的合约事件');
      }
    }
    
    // 获取合约中存储的最新价格
    const lastPrice = await priceConsumer.lastPrice();
    const lastTimestamp = await priceConsumer.lastPriceTimestamp();
    // 显式转换BigInt值以避免类型错误
    const formattedPrice = ethers.formatUnits(BigInt(lastPrice), 8);
    const timestamp = parseInt(lastTimestamp.toString());
    console.log('\n合约中存储的最新价格:', formattedPrice, 'USD');
    console.log('价格更新时间:', new Date(timestamp * 1000).toLocaleString());
  } catch (error) {
    console.error('获取价格失败:', error.message);
    // 打印完整错误栈以便调试
    console.error('错误详情:', error);
  }
  console.log('\n');

  // 测试4: 直接触发价格阈值检查
  console.log('===== 测试4: 直接触发价格阈值检查 =====');
  try {
    console.log('调用checkPriceThreshold()...');
    const tx = await priceConsumer.checkPriceThreshold();
    console.log('检查阈值交易哈希:', tx.hash);
    
    // 等待交易确认
    const receipt = await tx.wait();
    console.log('阈值检查完成');
    
    // 检查是否有新的阈值事件
    receipt.logs.forEach((log, index) => {
      try {
        const event = priceConsumer.interface.parseLog(log);
        if (event.name === 'PriceThresholdExceeded' || event.name === 'PriceThresholdBelow') {
          console.log(`  触发阈值事件: ${event.name}`);
          console.log(`    当前价格: ${ethers.formatUnits(event.args[0], 8)} USD`);
          console.log(`    阈值: ${ethers.formatUnits(event.args[1], 8)} USD`);
        }
      } catch (e) {
        // 忽略无法解析的事件
      }
    });
  } catch (error) {
    console.error('检查阈值失败:', error.message);
  }
  
  console.log('\n===== 合约测试完成 =====');
  console.log('\n建议的下一步操作:');
  console.log('1. 在不同时间点运行此脚本，观察ETH价格变化');
  console.log('2. 修改阈值设置，测试不同价格阈值的响应');
  console.log('3. 通过区块链浏览器查看合约的交易和事件记录');
  console.log('4. 如果需要，部署新的合约实例进行更多测试');
}

// 执行主函数
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('测试过程中发生错误:', error);
    process.exit(1);
  });