// 显式加载dotenv包，确保环境变量被正确读取
require('dotenv').config()
// 导入Hardhat工具包，它包含了常用的Hardhat插件和功能
// 其中包括dotenv功能，可以自动读取.env文件中的环境变量
require("@nomicfoundation/hardhat-toolbox");
// 导入OpenZeppelin的Hardhat升级插件，用于部署可升级合约
require("@openzeppelin/hardhat-upgrades");

/**
 * @type import('hardhat/config').HardhatUserConfig
 * 定义Hardhat配置对象，包含Solidity编译器版本、网络配置和Etherscan验证配置等
 */
module.exports = {
  // 指定Solidity编译器版本
  solidity: "0.8.28",
  
  // 网络配置部分，定义了项目可以部署到的不同网络
  networks: {
    // Hardhat内置的本地开发网络
    hardhat: {
      // 默认的本地开发网络，适合开发和测试
      // 自动提供10个测试账户，每个账户有10000 ETH
      // 支持区块时间操控、交易回滚等高级调试功能
    },
    
    // Sepolia测试网络配置
    sepolia: {
      // 网络URL，优先从环境变量读取，如果不存在则使用默认值
      url: process.env.SEPOLIA_URL || "https://eth-sepolia.g.alchemy.com/v2/your-api-key",
      
      // 部署合约使用的账户，从环境变量读取私钥
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      
      // Sepolia测试网络的链ID
      chainId: 11155111
    }
  },
  
  // Etherscan配置，用于合约验证
  etherscan: {
    // Etherscan API密钥，从环境变量读取
    apiKey: process.env.ETHERSCAN_API_KEY
  },
  
  // Sourcify配置，Sourcify是一个开源的智能合约源代码验证服务
  // 启用此配置后，Hardhat 会在部署合约时支持将合约源代码提交到 Sourcify 进行验证
  sourcify: {
    // 设置为 true 表示启用 Sourcify 合约源代码验证功能
    enabled: true
  }
};
