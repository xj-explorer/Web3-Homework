# Hardhat 3 Beta Factory模式示例项目

# Hardhat 工厂模式智能合约项目

这个项目展示了一个使用Hardhat 3的工厂模式智能合约实现，包含计数器合约(Counter)及其工厂合约(CounterFactory)，并提供了完整的测试和验证脚本。项目使用`mocha`进行测试，`ethers`库进行以太坊交互，并支持在Sepolia测试网上部署和验证合约功能。

## 项目概述

这个项目主要特点包括：

- 实现了工厂模式的智能合约架构
- 支持Foundry的Solidity单元测试
- 使用`mocha`和ethers.js的TypeScript集成测试
- 提供了在Sepolia测试网上验证合约功能的完整脚本
- 支持批量创建和管理智能合约实例
- 实现了事件监听和验证功能

## 项目结构

项目采用标准的Hardhat项目结构，主要包含以下内容：

```
├── .gitignore              # Git忽略文件配置
├── README.md               # 项目说明文档
├── contracts/              # 智能合约源码目录
│   ├── Counter.sol         # 计数器合约实现
│   ├── Counter.t.sol       # Counter合约的Foundry风格测试
│   ├── CounterFactory.sol  # 工厂合约实现
│   └── CounterFactory.t.sol # CounterFactory合约的Foundry风格测试
├── hardhat.config.ts       # Hardhat配置文件
├── ignition/               # Hardhat Ignition部署模块
│   ├── deployments/        # 部署历史和状态
│   └── modules/            # 部署模块定义
├── package-lock.json       # 依赖锁定文件
├── package.json            # 项目依赖配置
├── scripts/                # 脚本目录
│   └── verify-factory.ts   # CounterFactory合约功能验证脚本
├── test/                   # TypeScript测试目录
│   ├── Counter.ts          # Counter合约的TypeScript测试
│   └── CounterFactory.test.ts # CounterFactory合约的TypeScript测试
└── tsconfig.json           # TypeScript配置文件
```

## 合约结构与功能

### Counter.sol

**Counter** 是一个简单的计数器合约，实现了基本的计数功能和事件通知机制：

- 维护一个内部计数变量 `x`
- 提供 `inc()` 函数：将计数值增加1并触发 `Increment(1)` 事件
- 提供 `incBy(uint by)` 函数：将计数值增加指定数量并触发 `Increment(by)` 事件
- 提供 `get()` 函数：返回当前计数值
- 实现了事件监听机制，用于监控计数值变化

### CounterFactory.sol

**CounterFactory** 是一个工厂合约，负责批量创建和管理Counter合约实例：

- 提供 `createCounter()` 函数：创建单个Counter合约实例
- 提供 `createCounters(uint n)` 函数：批量创建n个Counter合约实例
- 维护所有创建的Counter合约地址列表
- 提供 `getCounter(uint index)` 函数：根据索引获取Counter合约地址
- 提供 `getAllCounters()` 函数：获取所有创建的Counter合约地址

### verify-factory.ts 脚本

**verify-factory.ts** 是一个功能验证脚本，用于在Sepolia测试网上测试CounterFactory合约的完整功能：

- 部署CounterFactory合约
- 测试单个Counter合约创建和功能验证
- 测试批量Counter合约创建功能
- 验证Counter合约的 `inc()` 和 `incBy()` 函数正确触发Increment事件
- 实现了事件过滤和查询机制，精确捕获和验证事件数据
- 提供详细的日志输出，展示合约交互过程和结果

## 测试脚本

项目提供了两种类型的测试脚本：

### TypeScript 测试 (test/目录)

- **Counter.ts**: 测试Counter合约的基本功能
- **CounterFactory.test.ts**: 测试CounterFactory合约的创建和管理功能

### Solidity 测试 (contracts/目录)

- **Counter.t.sol**: Counter合约的Foundry风格单元测试
- **CounterFactory.t.sol**: CounterFactory合约的Foundry风格单元测试

## 使用指南

### 前提条件

在使用本项目前，请确保您已安装以下软件：

- Node.js (v14或更高版本)
- npm 或 yarn
- Git

### 安装依赖

克隆仓库后，首先安装项目依赖：

```shell
npm install
# 或
# yarn install
```

### 运行测试

项目支持多种测试方式，您可以根据需要选择：

#### 运行所有测试

要运行项目中的所有测试（包括Solidity和TypeScript测试），请执行以下命令：

```shell
npx hardhat test
```

#### 选择性运行测试

您也可以选择性地运行Solidity或`mocha`测试：

```shell
npx hardhat test solidity   # 仅运行Solidity测试
npx hardhat test mocha      # 仅运行TypeScript测试
```

#### 运行特定的测试脚本

您可以通过指定文件路径来运行特定的测试脚本：

```shell
# 运行Counter合约的TypeScript测试
npx hardhat test test/Counter.ts

# 运行CounterFactory合约的TypeScript测试
npx hardhat test test/CounterFactory.test.ts

# 运行Counter合约的Solidity测试
npx hardhat test contracts/Counter.t.sol

# 运行CounterFactory合约的Solidity测试
npx hardhat test contracts/CounterFactory.t.sol
```

### 部署与验证合约

#### 配置环境变量

要部署和验证合约，您需要配置Sepolia测试网的私钥。有两种方式设置：

**方法1：使用hardhat-keystore插件（推荐）**

```shell
npx hardhat keystore set SEPOLIA_PRIVATE_KEY
```

**方法2：设置环境变量**

在项目根目录创建`.env`文件，并添加以下内容：

```
SEPOLIA_PRIVATE_KEY=your_private_key_here
```

注意：请确保`.env`文件已添加到`.gitignore`中，以避免泄露私钥。

#### 部署合约到Sepolia测试网

使用Ignition模块部署合约：

```shell
npx hardhat ignition deploy --network sepolia ignition/modules/Counter.ts
```

#### 验证CounterFactory合约功能

项目提供了`verify-factory.ts`脚本，用于在Sepolia测试网上完整验证CounterFactory合约的功能，包括事件监听和验证：

```shell
npx hardhat run scripts/verify-factory.ts --network sepolia
```

该脚本将执行以下操作：
1. 部署CounterFactory合约
2. 创建单个Counter合约并调用其方法
3. 批量创建多个Counter合约
4. 验证Counter合约的`inc()`和`incBy()`函数正确触发Increment事件
5. 输出详细的验证结果日志

### 使用本地开发网络

您还可以在本地Hardhat网络上运行测试和开发：

```shell
npx hardhat node       # 启动本地Hardhat网络
```

在另一个终端中运行测试或脚本：

```shell
npx hardhat test       # 在本地网络上运行测试
# 或
npx hardhat run scripts/verify-factory.ts --network localhost  # 在本地网络上运行验证脚本
  ```

## 技术栈

项目使用了以下主要技术和工具：

| 技术/工具 | 版本 | 用途 |
|----------|------|------|
| Solidity | ^0.8.0 | 智能合约开发语言 |
| Hardhat | ^3.0.0 | 以太坊开发环境和框架 |
| Ethers.js | ^6.0.0 | 以太坊JavaScript库，用于合约交互 |
| TypeScript | ^5.0.0 | 静态类型JavaScript超集，用于测试和脚本开发 |
| Mocha | ^10.0.0 | JavaScript测试框架 |
| Foundry | - | Solidity测试框架 |
| Hardhat Ignition | - | 声明式部署系统 |

## 工厂模式优势

本项目实现了工厂模式的智能合约架构，具有以下优势：

1. **集中管理**：通过工厂合约集中创建和管理所有Counter合约实例
2. **批量创建**：支持一次性创建多个合约实例，提高效率
3. **降低部署成本**：工厂模式可以降低每个合约的平均部署成本
4. **标准化创建**：确保所有创建的合约实例具有相同的初始化状态
5. **易于扩展**：可在工厂合约中添加额外的管理功能，如升级、暂停等

## 常见问题解决方法

### 1. 部署失败

如果在Sepolia测试网上部署失败，请检查：
- 账户是否有足够的Sepolia ETH（可通过[Sepolia水龙头](https://sepoliafaucet.com/)获取）
- 私钥是否正确配置
- 网络连接是否正常

### 2. 事件监听问题

如果在验证脚本中遇到事件监听相关问题，可能的原因包括：
- 区块确认延迟：Sepolia测试网可能存在一定的区块确认延迟
- 事件过滤器配置问题：确保事件过滤器正确设置了参数和区块范围

### 3. 依赖安装问题

如果遇到依赖安装失败，请尝试：

```shell
npm cache clean --force
npm install
```

## 总结

本项目展示了如何使用Hardhat 3实现工厂模式的智能合约架构，包括计数器合约及其工厂合约的完整实现、测试和验证流程。通过`verify-factory.ts`脚本，您可以在Sepolia测试网上全面验证合约功能，包括事件监听和验证机制。

该项目不仅提供了基础的智能合约开发模板，还展示了如何处理复杂的合约交互场景，如事件监听、批量创建合约等。通过这个项目，您可以深入了解智能合约工厂模式的设计和实现，以及如何使用Hardhat生态系统进行以太坊开发。
