# 将合约部署到Sepolia测试网

## 前提条件
1. 安装Node.js和npm
2. 拥有一个以太坊钱包（如MetaMask），并在Sepolia测试网上有一些测试ETH
3. 拥有一个Infura或Alchemy账户（用于访问Sepolia测试网节点）

## 步骤1：配置环境变量
1. 打开项目根目录下的`.env`文件
2. 替换以下内容：
   - `YOUR_INFURA_PROJECT_ID`：替换为你的Infura项目ID
   - `YOUR_PRIVATE_KEY`：替换为你的以太坊钱包私钥（确保该钱包在Sepolia测试网上有测试ETH）

   示例：
   ```
   # Sepolia Testnet Configuration
   SEPOLIA_URL=https://sepolia.infura.io/v3/1234567890abcdef1234567890abcdef
   PRIVATE_KEY=0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef
   ```

## 步骤2：安装依赖
确保所有依赖都已安装：
```bash
npm install
```

## 步骤3：部署合约
使用hardhat-deploy插件部署合约：
```bash
npx hardhat deploy --network sepolia
```

## 步骤4：验证部署
部署完成后，你可以在终端输出中看到部署的合约地址。你可以通过以下方式验证：
1. 在Etherscan Sepolia测试网浏览器中搜索合约地址
2. 使用Hardhat控制台与合约交互

## 注意事项
1. 确保你的`.env`文件已添加到`.gitignore`中，不要将私钥提交到代码仓库
2. 测试网上的ETH可以通过 faucets 获得，如Infura或Alchemy的faucet
3. 部署合约会消耗Gas，请确保你的钱包中有足够的测试ETH
4. 如果部署失败，检查网络连接、API密钥和私钥是否正确

## 部署脚本说明
项目使用hardhat-deploy插件进行部署，部署脚本位于`deploy`目录：
1. `01-deploy-nft.js`：部署MyNFT合约
2. `02-deploy-erc20.js`：部署MyERC20合约
3. `03-deploy-auction.js`：部署Auction实现合约
4. `04-deploy-factory.js`：部署AuctionFactory合约，依赖于Auction合约

部署顺序由脚本中的`dependencies`字段控制。