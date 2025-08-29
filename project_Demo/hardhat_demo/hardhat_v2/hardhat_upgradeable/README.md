# Hardhat 可升级 Counter 合约项目

这是一个基于 Hardhat v2 的可升级计数器合约项目，支持使用 OpenZeppelin 的升级插件进行合约升级，同时保留合约状态。

## 项目结构

```
├── .gitignore        # Git忽略文件配置
├── README.md         # 项目说明文档
├── .env              # 环境变量配置文件（不提交到代码仓库）
├── contracts/        # 智能合约源码目录
│   ├── Counter.sol   # 原始计数器合约
│   ├── CounterUpgradeable.sol # 可升级版本的计数器合约
│   └── Counter_v2.sol # 升级后的计数器合约，继承自CounterUpgradeable
├── hardhat.config.js # Hardhat 配置文件
├── ignition/         # Hardhat Ignition 部署模块
│   └── modules/      # 部署模块目录
│       ├── Counter.js # Counter合约的部署模块
│       └── CounterUpgradeable.js # CounterUpgradeable合约的部署模块
├── package-lock.json # 依赖锁文件
├── package.json      # 项目依赖配置
├── scripts/          # 脚本文件目录
│   ├── interact-with-local-counter.js # 与本地网络Counter合约交互的脚本
│   ├── interact-with-sepolia-counter.js # 与Sepolia测试网络Counter合约交互的脚本
│   ├── interact-with-sepolia-counterUpgradeable.js # 与Sepolia测试网络可升级CounterUpgradeable合约交互的脚本
│   ├── deploy-upgradeable-counter.js # 部署可升级Counter合约的脚本
│   └── upgrade-counter.js # 升级Counter合约的脚本
└── test/             # 测试文件目录
    ├── Counter.test.js # 计数器合约测试用例
    └── CounterUpgradeable.test.js # 可升级计数器合约测试用例
```

## 安装依赖

```shell
npm install
```

## 编译合约

```shell
npx hardhat compile
// 执行脚本后，会生成cache目录和artifacts目录，artifacts中包含编译后的合约字节码和ABI
```

## 运行测试

使用 Mocha 和 Chai 运行测试用例：

```shell
npx hardhat test
```

查看测试时的 gas 使用情况：

```shell
REPORT_GAS=true npx hardhat test
```

## 部署合约

本项目使用 Hardhat Ignition 进行合约部署，这是 Hardhat v2 的官方部署工具。

### 部署到本地开发网络

1. 首先启动本地 Hardhat 节点：
   ```shell
   npx hardhat node
   ```

2. 在另一个终端中部署合约：
   ```shell
   npx hardhat ignition deploy ./ignition/modules/Counter.js --network localhost --reset
   ```
   // --reset 参数用于重置部署状态，强制重新部署合约，即使之前已经部署过相同的合约

3. 验证合约部署成功：
   - 部署命令执行后，控制台会显示合约的部署地址
   - 本地节点终端会显示部署交易的详细信息，包括交易哈希和区块号

4. 使用脚本与本地网络上的合约交互：
   - 项目已包含一个预定义的交互脚本，位于 `scripts/interact-with-local-counter.js`
   - 首先需要编辑脚本文件，将其中的 `contractAddress` 变量替换为实际的部署地址
   - 执行脚本：
     ```shell
     npx hardhat run scripts/interact-with-local-counter.js --network localhost
     ```
   
   脚本会执行以下操作：
   - 连接到本地Hardhat网络
   - 查看当前计数值
   - 执行增加计数操作
   - 执行减少计数操作
   - 执行重置计数操作
   - 显示每个操作后的计数值和交易哈希

5. 也可以使用Hardhat控制台与合约交互。在Hardhat控制台中，您可以直接输入以下JavaScript代码与合约进行交互：
   ```shell
   npx hardhat console --network localhost
   ```
   执行后，会打开一个Hardhat控制台，您可以在其中直接输入JavaScript代码与合约进行交互。

   在控制台中与合约交互的示例：
   ```javascript
   // 加载合约实例
   const Counter = await ethers.getContractFactory("Counter");
   // 替换为实际的部署地址
   const counter = await Counter.attach("0x5FbDB2315678afecb367f032d93F642f64180aa3");
   
   // 调用合约函数
   await counter.getCount(); // 查看当前计数，应返回 0
   await counter.increment(); // 增加计数
   await counter.getCount(); // 再次查看计数，应返回 1
   await counter.decrement(); // 减少计数
   await counter.reset(); // 重置计数为 0
   ```
   
   注意：所有在控制台中的交易都会在本地节点的日志中显示详细信息

### 部署到 Sepolia 测试网络

1. 确保在 `.env` 文件中设置了正确的环境变量：
   ```
   SEPOLIA_URL=https://eth-sepolia.g.alchemy.com/v2/your-api-key
   PRIVATE_KEY=your-private-key
   ```

2. 部署合约到 Sepolia 测试网络：
   ```shell
   npx hardhat ignition deploy ./ignition/modules/Counter.js --network sepolia --reset
   ```
   // --reset 参数用于重置部署状态，强制重新部署合约，即使之前已经部署过相同的合约

   已部署合约地址：0xf37E97E38C82DA4E3aE62e8cCa76aFf3329F6B07

3. 部署报错ProviderError: Must be authenticated 排查
   ```
   npx hardhat console --network sepolia  # 启动 Sepolia 测试网络的 Hardhat 交互式控制台
   // 进入控制台后执行以下命令，用于排查部署报错问题s
   console.log(hre.network.config.url);  // 打印 Sepolia 网络配置的 RPC URL，确认网络连接地址是否正确
   console.log(hre.network.config.accounts.length > 0);  // 检查是否配置了有效的账户，若返回 true 表示已配置账户，false 则表示未配置
   ```

4. 使用脚本与Sepolia测试网络上的合约交互：
   - 项目已包含一个预定义的交互脚本，位于 `scripts/interact-with-sepolia-counter.js`
   - 执行脚本：
     ```shell
     npx hardhat run scripts/interact-with-sepolia-counter.js --network sepolia
     ```
   
   脚本会执行以下操作：
   - 连接到Sepolia测试网络
   - 显示当前使用的账户地址和余额
   - 连接到已部署的Counter合约
   - 查看当前计数值
   - 执行增加计数操作
   - 执行减少计数操作
   - 执行重置计数操作
   - 显示每个操作后的计数值和交易哈希
   - 提供Etherscan上查看合约的链接



## 部署可升级合约

本项目支持使用 OpenZeppelin 的升级插件部署可升级合约。这种方式可以在不改变合约地址和保留合约状态的情况下更新合约代码。

### 部署可升级合约到本地开发网络

1. 首先启动本地 Hardhat 节点：
   ```shell
   npx hardhat node
   ```

2. 在另一个终端中使用专门的部署脚本来部署可升级合约：
   ```shell
   npx hardhat run scripts/deploy-upgradeable-counter.js --network localhost
   ```

3. 部署成功后，控制台会显示代理合约地址和实现合约地址：
   ```
   可升级合约部署成功！
   代理合约地址: 0x5FbDB2315678afecb367f032d93F642f64180aa3
   实现合约地址: 0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0
   ```

### 部署可升级合约到 Sepolia 测试网络

```shell
npx hardhat run scripts/deploy-upgradeable-counter.js --network sepolia
代理合约地址: 0x2653e2f4485D95c5737fe0274E9B9A83E0c0A318
实现合约地址: 0x7D11dF13C7B3223248f049cCdaC7AcA0df516b87
新的实现合约地址: 0x58F4fc233C4FBf585EADb860366963B042F69fc5
```
### 合约验证

在验证本地网络上的合约之前，请确保已启动本地节点：
```shell
npx hardhat node
```

然后在另一个终端中执行以下命令进行验证：
```shell
npx hardhat verify --network localhost 0x7D11dF13C7B3223248f049cCdaC7AcA0df516b87
npx hardhat verify --network sepolia 0x7D11dF13C7B3223248f049cCdaC7AcA0df516b87
```


## 与 Sepolia 测试网络上的可升级合约交互

部署完成后，可以使用专门的交互脚本来与Sepolia测试网络上的可升级合约进行交互。

### 步骤说明

1. 首先，在部署可升级合约后，记录控制台输出的代理合约地址。

2. 编辑 `scripts/interact-with-sepolia-counterUpgradeable.js` 文件，将 `proxyContractAddress` 变量替换为实际部署的代理合约地址：
   ```javascript
   // 替换为实际的代理合约地址
   const proxyContractAddress = "YOUR_PROXY_CONTRACT_ADDRESS";
   ```

3. 确保 `.env` 文件中设置了正确的环境变量：
   ```
   SEPOLIA_URL=https://eth-sepolia.g.alchemy.com/v2/your-api-key
   PRIVATE_KEY=your-private-key
   ```

4. 执行交互脚本：
   ```shell
   npx hardhat run scripts/interact-with-sepolia-counterUpgradeable.js --network sepolia
   ```

### 脚本功能

该脚本会执行以下操作：
- 连接到Sepolia测试网络
- 显示当前使用的账户地址和余额
- 连接到已部署的可升级合约代理地址
- 查看当前计数值
- 执行增加计数操作
- 执行减少计数操作
- 执行重置计数操作
- 如果合约已升级到Counter_v2版本，会尝试调用v2版本特有的方法（helloWorld和multiply）
- 检查合约拥有者
- 提供Etherscan上查看合约的链接

### 注意事项

- 确保您的账户中有足够的Sepolia ETH用于支付Gas费用
- 代理合约地址在升级前后不会改变，始终使用同一个地址与合约交互
- 如果合约尚未升级到v2版本，脚本会自动跳过v2特有方法的调用并给出提示
- 所有链上操作都需要等待交易确认，在Sepolia测试网络上通常需要10-30秒


## 升级合约

项目支持将已部署的可升级合约升级到新版本。下面是升级合约的步骤：

### 升级本地开发网络上的合约

1. 确保本地 Hardhat 节点正在运行

2. 修改 `scripts/upgrade-counter.js` 文件，将 `proxyAddress` 变量设置为实际部署的代理合约地址

3. 执行升级脚本：
   ```shell
   npx hardhat run scripts/upgrade-counter.js --network localhost
   ```

4. 升级成功后，控制台会显示新的实现合约地址：
   ```
   合约升级成功！
   新的实现合约地址: 0x5FbDB2315678afecb367f032d93F642f64180aa3
   ```

### 升级 Sepolia 测试网络上的合约

1. 修改 `scripts/upgrade-counter.js` 文件，将 `proxyAddress` 变量设置为实际部署的代理合约地址

2. 执行升级脚本：
   ```shell
   npx hardhat run scripts/upgrade-counter.js --network sepolia
   ```

## 测试可升级合约

项目包含专门用于测试可升级合约的测试用例，可以使用以下命令运行：

```shell
npx hardhat test test/CounterUpgradeable.test.js
```

测试用例包括：
- 基本功能测试（增加、减少、重置计数）
- 事件测试
- 合约升级测试（验证升级后状态是否保留，新功能是否正常工作）


## 可升级合约的主要变化

### CounterUpgradeable 合约

- 继承自 `Initializable`, `UUPSUpgradeable`, 和 `OwnableUpgradeable`
- 使用 `initialize` 函数代替构造函数
- 实现了 `_authorizeUpgrade` 函数以控制升级权限
- 添加了存储间隙 `__gap` 以确保未来升级的安全性

### Counter_v2 合约
- 继承自 `CounterUpgradeable`
- 重写了 `increment` 方法，每次增加2而不是1
- 重写了 `reset` 方法，添加了更多的日志和事件
- 添加了新的 `multiply` 方法，用于将计数乘以指定倍数
- 添加了简单的 `helloWorld` 函数



## 合约功能说明

Counter 合约提供了以下功能：

- **getCount()**: 获取当前计数值
- **increment()**: 计数值加1
- **decrement()**: 计数值减1（如果计数大于0）
- **reset()**: 重置计数为0

每次计数改变时，合约会触发 `CountChanged` 事件。

## 环境变量配置

项目使用 `.env` 文件来管理环境变量，主要包括：

- **SEPOLIA_URL**: Sepolia 测试网络的 RPC URL
- **PRIVATE_KEY**: 部署合约的钱包私钥
- **ETHERSCAN_API_KEY**: Etherscan API 密钥（可选，用于合约验证）

注意：`.env` 文件包含敏感信息，请确保它已添加到 `.gitignore` 文件中，避免被提交到代码仓库。

## 其他有用的命令

查看 Hardhat 帮助：
```shell
npx hardhat help
```

启动交互式控制台：
```shell
npx hardhat console
```

## 注意事项

- 部署到 Sepolia 测试网络需要有 Sepolia ETH，可以通过水龙头获取
- 请妥善保管您的私钥，不要将其提交到代码仓库
- 本项目使用的是 Hardhat v2 版本，采用 Hardhat Ignition 进行合约部署
