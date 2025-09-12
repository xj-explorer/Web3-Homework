## Foundry

# Counter 合约项目

这是一个基于 Foundry 框架开发的以太坊计数器合约项目，包含原始版本和优化版本的 Counter 合约，以及 Gas 消耗分析功能。

## 项目介绍

本项目实现了一个简单但功能完整的计数器合约，用于演示 Solidity 智能合约的基本功能和 Gas 优化技术。项目包括：
- 原始版本 Counter 合约
- Gas 优化版本 CounterOptimized 合约
- 详细的 Gas 消耗测试和分析报告

## 合约功能

### Counter (原始版本)

Counter 合约提供以下功能：
- 设置数字（setNumber）
- 增加计数（increment）
- 批量增加（add）
- 减少计数（decrement）
- 批量减少（subtract）
- 乘法操作（multiply）
- 重置计数（reset）
- 读取当前值（number）
- 记录每次变更的事件（Changed）

### CounterOptimized (优化版本)

CounterOptimized 合约在原始功能基础上进行了多项 Gas 优化：
- 使用 uint64 替代 uint256，减少存储占用
- 使用内联汇编直接操作存储，减少 Solidity 的额外开销
- 简化事件结构，减少日志数据量
- 优化函数实现，减少不必要的操作步骤
- 在条件判断中使用短路逻辑

## 项目结构

```
├── src/                   # 合约源代码目录
│   ├── Counter.sol        # 原始版本计数器合约
│   └── CounterOptimized.sol # 优化版本计数器合约
├── test/                  # 测试文件目录
│   ├── Counter.t.sol      # 原始合约功能测试
│   ├── CounterGas.t.sol   # 原始合约Gas消耗测试
│   └── CounterOptimizedGas.t.sol # 优化合约Gas消耗测试
├── script/                # 部署脚本
│   └── Counter.s.sol      # Counter合约部署脚本
├── scripts/               # Python脚本目录
│   └── generate_gas_report.py # Gas报告生成脚本
├── Gas分析报告.md         # 原始合约Gas分析报告
└── Gas分析报告-优化版.md   # 优化合约Gas分析报告
```

## 快速开始

### 安装依赖

```shell
# 安装 Foundry（如果尚未安装）
curl -L https://foundry.paradigm.xyz | bash
foundryup

# 安装项目依赖
forge install
```

### 编译合约

```shell
forge build
```

### 运行测试

```shell
# 运行所有测试
forge test

# 运行原始合约的Gas测试
forge test --match-contract CounterGasTest

# 运行优化合约的Gas测试
forge test --match-contract CounterOptimizedGasTest

# 生成Gas报告并测试
forge test --gas-report
```

### 生成Gas分析报告

项目包含一个 Python 脚本，可以生成详细的 Gas 分析报告：

```shell
# 生成优化版本合约的Gas报告
python3 scripts/generate_gas_report.py

# 生成原始版本合约的Gas报告
python3 scripts/generate_gas_report.py --contract-type original

# 自定义输出文件路径
python3 scripts/generate_gas_report.py --output path/to/custom_report.md
```

## Gas 优化技术

优化版本合约主要应用了以下 Gas 优化策略：

1. **数据类型优化**：将 number 从 uint256 改为 uint64，减少存储占用
2. **内联汇编优化**：多个函数使用内联汇编直接操作存储，减少 Solidity 的额外开销
3. **事件优化**：简化事件结构，减少日志数据量
4. **函数实现优化**：简化函数逻辑，减少不必要的操作步骤
5. **短路逻辑**：在 decrement 和 subtract 函数中使用短路逻辑优化条件判断

## 部署合约

```shell
forge script script/Counter.s.sol:CounterScript --rpc-url <your_rpc_url> --private-key <your_private_key>
```

## Foundry 工具使用

Foundry 是一个快速、便携和模块化的以太坊应用开发工具包，主要包括：

- **Forge**: 以太坊测试框架
- **Cast**: 与 EVM 智能合约交互的瑞士军刀
- **Anvil**: 本地以太坊节点
- **Chisel**: 快速、实用、详细的 Solidity REPL

更多 Foundry 文档，请访问：https://book.getfoundry.sh/

### 常用命令

```shell
# 格式化代码
forge fmt

# 生成Gas快照
forge snapshot

# 启动本地节点
anvil

# 获取帮助
forge --help
anvil --help
cast --help
```
