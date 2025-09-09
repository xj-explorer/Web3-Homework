// 使用CommonJS语法兼容Hardhat部署系统
import { createWalletClient, createPublicClient, http } from 'viem';
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
 * ShibMemeToken合约部署脚本
 * 此脚本直接使用viem库部署合约，不依赖Hardhat的复杂性
 */
async function main() {
  try {
    // 从环境变量获取配置参数
    // 注意：在实际部署前，请确保这些环境变量已正确设置
    const SEPOLIA_URL = process.env.SEPOLIA_URL || 'https://sepolia.infura.io/v3/1ea13488a02d481c8663b068c0d6fa35';
    const PRIVATE_KEY = process.env.PRIVATE_KEY || '5ed85e0536a6d5eec133290546d2fc6e98e5d80bacafe1aceb27c5e681fd581b';
    const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY || '7CHWZPGXJR6Z2H37DE24V711CGKDVUVTB6';

    // 验证私钥格式
    if (!PRIVATE_KEY || PRIVATE_KEY.length !== 64) {
      throw new Error(`无效的私钥格式，长度应为64个字符，当前长度: ${PRIVATE_KEY?.length || 0}`);
    }

    // 创建账户和客户端
    const account = privateKeyToAccount(`0x${PRIVATE_KEY}`);
    
    // 创建public client用于读取区块链数据（如余额）
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

    console.log('部署合约的账户地址:', account.address);
    
    // 使用public client获取账户余额
    const balance = await publicClient.getBalance({ address: account.address });
    console.log('部署账户余额:', balance.toString());

    // 设置合约部署参数
    const initialOwner = account.address; // 初始所有者地址
    const liquidityPoolAddress = account.address; // 流动性池地址
    const treasuryAddress = account.address; // 金库地址

    console.log('部署参数:');
    console.log('  初始所有者地址:', initialOwner);
    console.log('  流动性池地址:', liquidityPoolAddress);
    console.log('  金库地址:', treasuryAddress);

    // 部署ShibMemeToken合约
    console.log('开始部署ShibMemeToken合约...');
    const hash = await walletClient.deployContract({
      abi: ShibMemeToken.abi,
      bytecode: ShibMemeToken.bytecode,
      args: [initialOwner, liquidityPoolAddress, treasuryAddress],
    });

    console.log('交易哈希:', hash);
    console.log('等待合约部署确认...');
    
    // 等待交易确认并获取合约地址
    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    
    if (!receipt.contractAddress) {
      throw new Error('合约部署失败，未返回合约地址');
    }
    
    console.log('ShibMemeToken合约部署成功!');
    console.log('合约地址:', receipt.contractAddress);
    console.log('部署者:', account.address);
    console.log('初始所有者:', initialOwner);
    console.log('流动性池地址:', liquidityPoolAddress);
    console.log('金库地址:', treasuryAddress);
    console.log('==============================');
    console.log('\n请记录上述信息，以便后续使用和验证。');
    console.log('\n部署完成后，您可以使用以下命令验证合约:');
    console.log('  npx hardhat verify --network sepolia', receipt.contractAddress, initialOwner, liquidityPoolAddress, treasuryAddress);
  } catch (error) {
    console.error('部署过程中发生错误:', error);
    process.exit(1);
  }
}

// 执行部署函数
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });