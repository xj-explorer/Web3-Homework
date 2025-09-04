require("@nomicfoundation/hardhat-toolbox");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.28",
  networks: {
    sepolia: {
      url: "https://sepolia.infura.io/v3/".concat(process.env.INFURA_API_KEY || ""),
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 11155111,
      // Sepolia CCIP Router address: 0x0BF3dE8c5D3e8A2B34D2BEeB17ABfCeBaf363A59
    },
    amoy: {
      url: "https://polygon-amoy.infura.io/v3/".concat(process.env.INFURA_API_KEY || ""),
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 80002,
      // Amoy CCIP Router address: 0xC249632c2D40b9001FE907806902f63038B737Ab
    }
  }
};
