// 验证已部署的CounterFactory合约功能的脚本
// 此脚本将连接到Sepolia测试网并验证工厂合约的各项功能

import { network } from 'hardhat';

// 已部署的CounterFactory合约地址
const FACTORY_CONTRACT_ADDRESS = '0xf35D46b5c63E8f99b97Db483079dc912f3EFa85c';

// CounterFactory合约的ABI接口定义
const COUNTER_FACTORY_ABI = [
  'function getCountersCount() external view returns (uint)',
  'function getCounter(uint index) external view returns (address)',
  'function createCounter() public returns (address)',
  'function createMultipleCounters(uint count) external returns (address[] memory)',
  'event CounterCreated(address indexed counterAddress, address indexed creator)'
];

// Counter合约的完整ABI定义，确保事件能够被正确识别
const COUNTER_ABI = [
  'function x() public view returns (uint)',
  'function inc() public',
  'function incBy(uint by) public',
  {"anonymous":false,"inputs":[{"indexed":false,"internalType":"uint256","name":"by","type":"uint256"}],"name":"Increment","type":"event"}
];

async function main() {
  console.log('===== 开始验证CounterFactory合约功能 =====\n');
  
  // 1. 连接到Sepolia测试网
  const { ethers } = await network.connect();
  const [deployer] = await ethers.getSigners();
  console.log(`连接到Sepolia测试网，使用地址: ${deployer.address}`);
  console.log(`账户余额: ${(await ethers.provider.getBalance(deployer.address)).toString()} wei\n`);

  // 2. 实例化CounterFactory合约
  const factoryContract = new ethers.Contract(
    FACTORY_CONTRACT_ADDRESS,
    COUNTER_FACTORY_ABI,
    deployer
  );
  console.log(`已实例化CounterFactory合约，地址: ${FACTORY_CONTRACT_ADDRESS}`);

  // 3. 验证工厂合约的基本信息
  const initialCount = await factoryContract.getCountersCount();
  console.log(`\n当前工厂合约中Counter合约数量: ${initialCount.toString()}`);

  if (initialCount > 0) {
    const firstCounterAddress = await factoryContract.getCounter(0);
    console.log(`第一个Counter合约地址: ${firstCounterAddress}`);
  }

  // 4. 创建一个新的Counter合约并验证
  console.log('\n=== 测试创建新的Counter合约 ===');
  const createTx = await factoryContract.createCounter();
  console.log('创建交易已发送，等待确认...');
  const createReceipt = await createTx.wait();
  console.log(`交易已确认，区块号: ${createReceipt.blockNumber}`);
  
  // 通过getCounter()函数获取新创建的Counter合约地址
  const newCount = await factoryContract.getCountersCount();
  const newCounterAddress = await factoryContract.getCounter(newCount - 1n);
  console.log(`成功创建新的Counter合约，地址: ${newCounterAddress}`);

  // 5. 验证创建后计数器数量增加
  console.log(`创建后工厂合约中Counter合约数量: ${newCount.toString()}`);
  
  if (newCount !== initialCount + 1n) {
    console.error('错误: 计数器数量未正确增加');
  } else {
    console.log('✓ 计数器数量正确增加');
  }

  // 6. 验证新创建的Counter合约功能
  console.log('\n=== 测试Counter合约的基本功能 ===');
  // 使用ethers.getContractAt代替直接实例化，以更好地处理事件
  const counterContract = await ethers.getContractAt('Counter', newCounterAddress, deployer);

  // 验证初始值为0
  const initialValue = await counterContract.x();
  console.log(`Counter初始值: ${initialValue.toString()}`);
  
  if (initialValue !== 0n) {
    console.error('错误: Counter初始值不为0');
  } else {
    console.log('✓ Counter初始值正确');
  }

  // 测试inc()函数
  console.log('\n测试inc()函数...');
  const incTx = await counterContract.inc();
  const incReceipt = await incTx.wait();
  const incTx2 = await counterContract.inc();
  const incReceipt2 = await incTx2.wait();
  console.log('inc()交易已确认');
  
  const valueAfterInc = await counterContract.x();
  console.log(`调用inc()后的值: ${valueAfterInc.toString()}`);
  
  if (valueAfterInc !== 1n) {
    console.error('错误: inc()函数未正确工作');
  } else {
    console.log('✓ inc()函数工作正常');
  }

  // 测试incBy()函数
  const incrementAmount = 5n;
  console.log(`\n测试incBy(${incrementAmount})函数...`);
  const incByTx = await counterContract.incBy(incrementAmount);
  const incByReceipt = await incByTx.wait();
  console.log('incBy()交易已确认');
  
  const valueAfterIncBy = await counterContract.x();
  console.log(`调用incBy(${incrementAmount})后的值: ${valueAfterIncBy.toString()}`);
  
  if (valueAfterIncBy !== 1n + incrementAmount) {
    console.error('错误: incBy()函数未正确工作');
  } else {
    console.log('✓ incBy()函数工作正常');
  }

  // 7. 验证事件触发 - 使用事件过滤器方法
  console.log('\n=== 验证事件触发 ===');
  
  // 设置事件过滤器来监听Increment事件
  const eventFilter = counterContract.filters.Increment();
  
  // 查询inc()函数触发的Increment事件 - 使用精确的区块范围
  // 注意：在查询事件时，我们使用相同的区块号作为查询范围的起始和结束点（即精确的区块号 exactBlockNumber）。
  // 这样做的目的是确保只获取当前交易所在区块中触发的事件，避免获取到其他区块中的无关事件，
  // 从而能精准地验证当前特定交易是否成功触发了预期的事件。在本场景中，我们使用该方法来验证 inc() 函数调用所触发的 Increment 事件。
  const incEvents = await counterContract.queryFilter(
    eventFilter,
    incReceipt2!.blockNumber,  // 只查询当前交易所在区块
    incReceipt2!.blockNumber
  );

  // 只查询 incTx2 这个交易触发的 Increment 事件
  // const incEvents = await counterContract.queryFilter(
  //   eventFilter,
  //   incReceipt2!.blockNumber,  // 只查询当前交易所在区块
  //   incReceipt2!.blockNumber
  // ).then(events => events.filter(event => event.transactionHash === incTx2.hash));
  
  // 过滤出与inc()函数相符的事件（增量为1）
  const filteredIncEvents = incEvents.filter(event => event.args.by.toString() === '1');
  console.log('inc()函数触发的Increment事件数量:', filteredIncEvents.length);
  if (filteredIncEvents.length > 0) {
    filteredIncEvents.forEach((event, index) => {
      console.log(`✓ inc()函数触发的Increment事件${index+1}，增量: ${event.args.by.toString()}`);
    })
  } else {
    console.error('错误: 未检测到inc()函数触发的Increment事件');
    // 显示更多调试信息
    console.log('调试信息: 查询区块号:', incReceipt2!.blockNumber);
    console.log('调试信息: 实际返回的所有事件增量:', incEvents.map(e => e.args.by.toString()));
  }

  // 查询incBy()函数触发的Increment事件 - 使用精确的区块范围
  const incByEvents = await counterContract.queryFilter(
    eventFilter,
    incByReceipt!.blockNumber,  // 只查询当前交易所在区块
    incByReceipt!.blockNumber
  );
  
  // 过滤出与incBy(5)函数相符的事件（增量为5）
  const filteredIncByEvents = incByEvents.filter(event => event.args.by.toString() === '5');
  console.log('incBy(5)函数触发的Increment事件数量:', filteredIncByEvents.length);
  if (filteredIncByEvents.length > 0) {
    filteredIncByEvents.forEach((event, index) => {
      console.log(`✓ incBy(5)函数触发的Increment事件${index+1}，增量: ${event.args.by.toString()}`);
    })
  } else {
    console.error('错误: 未检测到incBy(5)函数触发的Increment事件');
    // 显示更多调试信息
    console.log('调试信息: 查询区块号:', incByReceipt!.blockNumber);
    console.log('调试信息: 实际返回的所有事件增量:', incByEvents.map(e => e.args.by.toString()));
  }
  

  // 8. 批量创建Counter合约测试
  console.log('\n=== 测试批量创建Counter合约 ===');
  const batchSize = 2n;
  const batchTx = await factoryContract.createMultipleCounters(batchSize);
  console.log('批量创建交易已发送，等待确认...');
  const batchReceipt = await batchTx.wait();
  console.log(`批量创建交易已确认，区块号: ${batchReceipt.blockNumber}`);
  
  const finalCount = await factoryContract.getCountersCount();
  console.log(`批量创建后工厂合约中Counter合约数量: ${finalCount.toString()}`);
  
  if (finalCount !== newCount + batchSize) {
    console.error('错误: 批量创建后计数器数量未正确增加');
  } else {
    console.log(`✓ 成功批量创建了${batchSize}个Counter合约`);
  }

  console.log('\n===== CounterFactory合约功能验证完成 =====');
}

// 执行主函数
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('验证过程中出现错误:', error);
    process.exit(1);
  });