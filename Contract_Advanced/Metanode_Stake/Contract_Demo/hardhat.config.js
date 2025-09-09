require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();
require("@openzeppelin/hardhat-upgrades");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.22",
    settings: {
      optimizer: {
        enabled: false,
        runs: 200,
      },
    },
  },
  networks: {
    hardhat: {},
    sepolia: {
      url: "https://sepolia.infura.io/v3/" + (process.env.INFURA_API_KEY || ""),
      // 只有在PRIVATE_KEY存在时才使用它，否则使用hardhat默认账户
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : undefined,
      gasPrice: 30000000000, // 30 Gwei
    },
  },
  etherscan: {
    // 只有在ETHERSCAN_API_KEY存在时才使用它
    apiKey: process.env.ETHERSCAN_API_KEY || undefined,
  },
};
// 注意：部署到Sepolia网络前，请确保.env文件中已填入有效的API密钥和私钥
