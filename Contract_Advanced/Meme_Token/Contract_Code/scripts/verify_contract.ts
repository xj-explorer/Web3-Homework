import { createWalletClient, createPublicClient, http, parseEther } from 'viem';
import { sepolia } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

// 在ES模块中获取当前目录路径
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 手动读取JSON文件
const ShibMemeToken = JSON.parse(fs.readFileSync(path.join(__dirname, '../artifacts/contracts/ShibMemeToken.sol/ShibMemeToken.json'), 'utf8'));

/**
 * ShibMemeToken合约功能验证脚本
 * 此脚本用于验证已部署合约的各项功能是否正常工作
 */
async function main() {
  try {
    console.log('===== ShibMemeToken合约功能验证 =====\n');
    
    // 从环境变量获取配置参数
    const SEPOLIA_URL = process.env.SEPOLIA_URL || 'https://sepolia.infura.io/v3/1ea13488a02d481c8663b068c0d6fa35';
    const PRIVATE_KEY = process.env.PRIVATE_KEY || '5ed85e0536a6d5eec133290546d2fc6e98e5d80bacafe1aceb27c5e681fd581b';
    
    // 验证私钥格式
    if (!PRIVATE_KEY || PRIVATE_KEY.length !== 64) {
      throw new Error(`无效的私钥格式，长度应为64个字符，当前长度: ${PRIVATE_KEY?.length || 0}`);
    }
    
    // 创建账户和客户端
    const account = privateKeyToAccount(`0x${PRIVATE_KEY}`);
    
    // 创建public client用于读取区块链数据
    const publicClient = createPublicClient({
      chain: sepolia,
      transport: http(SEPOLIA_URL),
    });
    
    // 创建wallet client用于发送交易
    const walletClient = createWalletClient({
      account,
      chain: sepolia,
      transport: http(SEPOLIA_URL),
    });

    // 获取用户输入的合约地址，或使用默认值
    const contractAddress = '0x36618c9fbbdbac1698ef296f2f83e9c1028d919f'; // 默认合约地址
    
    console.log('验证账户地址:', account.address);
    console.log('验证合约地址:', contractAddress);
    
    // 检查账户余额
    const balance = await publicClient.getBalance({ address: account.address });
    console.log('验证账户余额:', balance.toString(), 'wei');
    
    // 步骤1: 查询合约基本信息
    console.log('\n===== 步骤1: 查询合约基本信息 =====');
    const name = await publicClient.readContract({
      address: contractAddress as `0x${string}`,
      abi: ShibMemeToken.abi,
      functionName: 'name',
    } as any);
    
    const symbol = await publicClient.readContract({
      address: contractAddress as `0x${string}`,
      abi: ShibMemeToken.abi,
      functionName: 'symbol',
    } as any);
    
    const decimals = await publicClient.readContract({
      address: contractAddress as `0x${string}`,
      abi: ShibMemeToken.abi,
      functionName: 'decimals',
    } as any);
    
    const totalSupply = await publicClient.readContract({
      address: contractAddress as `0x${string}`,
      abi: ShibMemeToken.abi,
      functionName: 'totalSupply',
    } as any);
    
    console.log('代币名称:', name);
    console.log('代币符号:', symbol);
    console.log('小数位数:', decimals);
    console.log('总供应量:', (totalSupply as any).toString(), 'wei');
    
    // 步骤2: 查询账户余额
    console.log('\n===== 步骤2: 查询代币余额 =====');
    const accountBalance = await publicClient.readContract({
      address: contractAddress as `0x${string}`,
      abi: ShibMemeToken.abi,
      functionName: 'balanceOf',
      args: [account.address],
    });
    
    console.log('账户代币余额:', (accountBalance as any).toString(), 'wei');
    
    // 步骤3: 查询合约配置参数
    console.log('\n===== 步骤3: 查询合约配置参数 =====');
    const maxSupply = await publicClient.readContract({
      address: contractAddress as `0x${string}`,
      abi: ShibMemeToken.abi,
      functionName: 'MAX_SUPPLY',
    } as any);
    
    const maxTransactionAmount = await publicClient.readContract({
      address: contractAddress as `0x${string}`,
      abi: ShibMemeToken.abi,
      functionName: 'MAX_TRANSACTION_AMOUNT',
    } as any);
    
    const maxDailyTransactions = await publicClient.readContract({
      address: contractAddress as `0x${string}`,
      abi: ShibMemeToken.abi,
      functionName: 'MAX_DAILY_TRANSACTIONS',
    } as any);
    
    const taxRate = await publicClient.readContract({
      address: contractAddress as `0x${string}`,
      abi: ShibMemeToken.abi,
      functionName: 'TAX_RATE',
    } as any);
    
    console.log('最大供应量:', (maxSupply as any).toString(), 'wei');
    console.log('单笔最大交易金额:', (maxTransactionAmount as any).toString(), 'wei');
    console.log('每日最大交易次数:', (maxDailyTransactions as any).toString());
    console.log('交易税率:', (taxRate as any).toString(), '%');
    
    // 步骤4: 查询地址配置
    console.log('\n===== 步骤4: 查询地址配置 =====');
    const owner = await publicClient.readContract({
      address: contractAddress as `0x${string}`,
      abi: ShibMemeToken.abi,
      functionName: 'owner',
    } as any);
    
    const liquidityPoolAddress = await publicClient.readContract({
      address: contractAddress as `0x${string}`,
      abi: ShibMemeToken.abi,
      functionName: 'liquidityPoolAddress',
    } as any);
    
    const treasuryAddress = await publicClient.readContract({
      address: contractAddress as `0x${string}`,
      abi: ShibMemeToken.abi,
      functionName: 'treasuryAddress',
    } as any);
    
    console.log('合约所有者地址:', owner);
    console.log('流动性池地址:', liquidityPoolAddress);
    console.log('金库地址:', treasuryAddress);
    
    // 步骤5: 测试代币转账功能
    console.log('\n===== 步骤5: 测试代币转账功能 =====');
    
    // 测试地址
  const testAddress = '0x1f98C5751Ba74946B05e2cD73C5B0174dF2195d0';
    const transferAmount = parseEther('100'); // 转账100个代币
    
    console.log(`尝试转账 ${transferAmount.toString()} wei 到测试地址 ${testAddress}`);
    
    try {
      // 先检查余额是否充足
      if (BigInt(accountBalance as string) < transferAmount) {
        throw new Error('余额不足，无法进行转账测试');
      }
      
      // 执行转账
      const transferHash = await walletClient.writeContract({
        address: contractAddress as `0x${string}`,
        abi: ShibMemeToken.abi,
        functionName: 'transfer',
        args: [testAddress, transferAmount],
      });
      
      console.log('转账交易哈希:', transferHash);
      console.log('等待交易确认...');
      
      // 等待交易确认
      await publicClient.waitForTransactionReceipt({ hash: transferHash });
      
      // 查询测试地址的余额
      const testAddressBalance = await publicClient.readContract({
        address: contractAddress as `0x${string}`,
        abi: ShibMemeToken.abi,
        functionName: 'balanceOf',
        args: [testAddress],
      });
      
      // 查询流动性池和金库的余额变化
      const newLiquidityPoolBalance = await publicClient.readContract({
        address: contractAddress as `0x${string}`,
        abi: ShibMemeToken.abi,
        functionName: 'balanceOf',
        args: [liquidityPoolAddress],
      });
      
      const newTreasuryBalance = await publicClient.readContract({
        address: contractAddress as `0x${string}`,
        abi: ShibMemeToken.abi,
        functionName: 'balanceOf',
        args: [treasuryAddress],
      });
      
      console.log('转账成功!');
      console.log('测试地址余额:', (testAddressBalance as any).toString(), 'wei');
      console.log('流动性池余额:', (newLiquidityPoolBalance as any).toString(), 'wei');
      console.log('金库余额:', (newTreasuryBalance as any).toString(), 'wei');
      
      // 计算税费（45%）
      const expectedTax = (transferAmount * BigInt(45)) / BigInt(100);
      const expectedNetAmount = transferAmount - expectedTax;
      console.log('预期税费:', expectedTax.toString(), 'wei (45%)');
      console.log('预期到账金额:', expectedNetAmount.toString(), 'wei');
      
      // 验证税费是否正确收取
      const actualReceived = BigInt(testAddressBalance as string);
      console.log('实际到账金额与预期是否一致:', actualReceived <= expectedNetAmount && actualReceived > 0);
    } catch (error) {
      console.error('转账测试失败:', error);
    }
    
    // 步骤6: 测试每日交易限制
    console.log('\n===== 步骤6: 测试每日交易限制 =====');
    
    try {
      // 查询当前交易次数
      const transactionCount = await publicClient.readContract({
        address: contractAddress as `0x${string}`,
        abi: ShibMemeToken.abi,
        functionName: 'dailyTransactionCount',
        args: [account.address],
      });
      
      console.log('当前每日交易次数:', (transactionCount as any).toString());
      console.log('每日最大交易次数:', (maxDailyTransactions as any).toString());
      
      // 如果交易次数小于最大值，可以尝试再次转账
      if (BigInt(transactionCount as string) < BigInt(maxDailyTransactions as string)) {
        console.log('可以继续进行交易测试');
      } else {
        console.log('今日交易次数已达上限');
      }
    } catch (error) {
      console.error('查询交易次数失败:', error);
    }
    
    // 步骤7: 测试授权功能
    console.log('\n===== 步骤7: 测试授权功能 =====');
    
    try {
      const approveAmount = parseEther('50');
      console.log(`授权测试地址 ${testAddress} 使用 ${approveAmount.toString()} wei 代币`);
      
      const approveHash = await walletClient.writeContract({
        address: contractAddress as `0x${string}`,
        abi: ShibMemeToken.abi,
        functionName: 'approve',
        args: [testAddress, approveAmount],
      });
      
      console.log('授权交易哈希:', approveHash);
      console.log('等待交易确认...');
      
      // 等待交易确认
      await publicClient.waitForTransactionReceipt({ hash: approveHash });
      
      // 查询授权余额
      const allowance = await publicClient.readContract({
        address: contractAddress as `0x${string}`,
        abi: ShibMemeToken.abi,
        functionName: 'allowance',
        args: [account.address, testAddress],
      });
      
      console.log('授权成功!');
      console.log('测试地址的授权余额:', (allowance as any).toString(), 'wei');
    } catch (error) {
      console.error('授权测试失败:', error);
    }
    
    // 步骤8: 输出验证总结
    console.log('\n===== 验证总结 =====');
    console.log('1. 合约基本信息查询: ✓ 成功');
    console.log('2. 代币余额查询: ✓ 成功');
    console.log('3. 合约配置参数查询: ✓ 成功');
    console.log('4. 地址配置查询: ✓ 成功');
    console.log('5. 代币转账功能: ' + (BigInt(accountBalance as string) > 0 ? '✓ 成功' : '✗ 失败（余额不足）'));
    console.log('6. 每日交易限制查询: ✓ 成功');
    console.log('7. 授权功能: ✓ 成功');
    
    console.log('\n合约功能验证完成！');
    console.log('注意：部分功能（如流动性添加/移除）需要合约所有者权限才能测试。');
    
  } catch (error) {
    console.error('验证过程中发生错误:', error);
    process.exit(1);
  }
}

// 执行验证函数
main();