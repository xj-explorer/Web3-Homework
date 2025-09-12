import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox-viem";
import "@nomicfoundation/hardhat-verify";
import "hardhat-gas-reporter"

const config: any = {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  defaultNetwork: "hardhat",
  networks: {
    hardhat: {
    },
    sepolia: {
      url: "",
      accounts: [], // 空数组表示在测试时使用自动生成的账户
    },
  },
  etherscan: {
    apiKey: {
      sepolia: "",
    },
  },
  gasReporter: {
    enable: true,
    currency: '$'
  }
};

// 使用正确的导出方式
export default config;
