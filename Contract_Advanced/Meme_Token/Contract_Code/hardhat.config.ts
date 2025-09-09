// import type { HardhatUserConfig } from "hardhat/config";

import hardhatToolboxViemPlugin from "@nomicfoundation/hardhat-toolbox-viem";
// import { HardhatUserConfig } from "hardhat/config";

// 导入dotenv并加载环境变量
import dotenv from "dotenv";
dotenv.config();

const config: any = {
  plugins: [hardhatToolboxViemPlugin],
  solidity: {
    profiles: {
      default: {
        version: "0.8.28",
      },
      production: {
        version: "0.8.28",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
    },
  },
  networks: {
    hardhatMainnet: {
      type: "edr-simulated",
      chainType: "l1",
    },
    hardhatOp: {
      type: "edr-simulated",
      chainType: "op",
    },
    sepolia: {
      type: "http",
      chainType: "l1",
      url: process.env.SEPOLIA_RPC_URL,
      accounts: [process.env.SEPOLIA_PRIVATE_KEY || ""],
    },
  },
  // 添加Etherscan验证配置
  etherscan: {
    apiKey: "7CHWZPGXJR6Z2H37DE24V711CGKDVUVTB6", // 直接设置API密钥以避免配置问题
  },
};

export default config;
