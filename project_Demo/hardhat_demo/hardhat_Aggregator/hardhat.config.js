require("@nomicfoundation/hardhat-toolbox");
// 加载环境变量
require('dotenv').config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.28",
  networks: {
    // 本地开发网络
    localhost: {
      url: "http://127.0.0.1:8545"
    },
    // Sepolia测试网配置
    sepolia: {
      url: process.env.SEPOLIA_RPC_URL || "",
      accounts: process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
      chainId: 11155111
    }
  },
  // Etherscan配置（用于合约验证）
  etherscan: {
    apiKey: {
      sepolia: process.env.ETHERSCAN_API_KEY
    }
  }
};
