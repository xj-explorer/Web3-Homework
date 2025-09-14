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

CounterOptimized 合约在保持原始功能的基础上进行了多项 Gas 优化，提供以下功能：
- 设置数字（setNumber）
- 增加计数（increment）
- 批量增加（add）
- 减少计数（decrement）
- 批量减少（subtract）
- 乘法操作（multiply）
- 重置计数（reset）
- 读取当前值（number）
- 记录每次变更的事件（Changed）

优化点包括：
- 使用 uint64 替代 uint256，减少存储占用
- 使用内联汇编直接操作存储，减少 Solidity 的额外开销
- 简化事件结构，减少日志数据量
- 优化函数实现，减少不必要的操作步骤
- 在条件判断中使用短路逻辑

## 项目结构

```
├── .github/               # GitHub配置目录
│   └── workflows/         # GitHub Actions工作流配置
├── .gitignore             # Git忽略文件配置
├── foundry.lock           # Foundry依赖锁文件
├── foundry.toml           # Foundry配置文件
├── broadcast/             # 部署交易广播记录
│   ├── Counter.s.sol/     # Counter部署交易记录
│   │   └── 11155111/      # Sepolia测试网(链ID:11155111)部署记录
│   └── VerifyCounterOptimized.s.sol/ # 验证脚本交易记录
│       └── 11155111/      # Sepolia测试网(链ID:11155111)验证记录
├── lib/                   # 第三方库目录
│   └── forge-std/         # Foundry标准库
├── src/                   # 合约源代码目录
│   ├── Counter.sol        # 原始版本计数器合约
│   └── CounterOptimized.sol # 优化版本计数器合约
├── test/                  # 测试文件目录
│   ├── Counter.t.sol      # 原始合约功能测试
│   ├── CounterGas.t.sol   # 原始合约Gas消耗测试
│   ├── CounterOptimizedGas.t.sol # 优化合约Gas消耗测试
│   └── CounterOptimizedTest.sol # 优化合约边界条件测试
├── script/                # 部署脚本目录
│   ├── Counter.s.sol      # Counter合约部署脚本
│   └── VerifyCounterOptimized.s.sol # 已部署合约验证脚本
├── scripts/               # Python脚本目录
│   └── generate_gas_report.py # Gas报告生成脚本
├── Gas分析报告.md         # 原始合约Gas分析报告
├── Gas分析报告-优化版.md   # 优化合约Gas分析报告
└── README.md              # 项目说明文档
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
2. **内联汇编优化**：在 setNumber、increment、add、decrement、subtract、multiply 和 reset 函数中使用内联汇编直接操作存储，减少 Solidity 的额外开销
3. **事件优化**：简化事件结构，只记录新值且使用 indexed 参数
4. **构造函数优化**：直接赋值，简化逻辑
5. **短路逻辑优化**：在 decrement 和 subtract 函数中使用短路逻辑优化条件判断
6. **避免重复计算**：在 subtract 函数中优化条件判断逻辑
7. **reset 函数优化**：直接设为 0，使用内联汇编进一步减少 Gas 消耗

## 部署合约

项目已配置了.env文件和部署脚本，可以方便地将合约部署到Sepolia测试网。

### 部署到Sepolia测试网

.env文件已包含以下配置：
- Sepolia测试网RPC URL
- 部署私钥

使用修改后的部署脚本，可以一键部署原始版本和优化版本的合约：

```shell
# 使用.env文件中的配置部署合约（推荐方式）
forge script script/Counter.s.sol:CounterScript --rpc-url $(grep SEPOLIA_URL .env | cut -d '=' -f2) --private-key $(grep PRIVATE_KEY .env | cut -d '=' -f2) --broadcast
# 使用 Foundry 的 forge script 命令来执行部署脚本
# `forge script` 是 Foundry 用于执行脚本的命令，可用于部署合约、与合约交互等操作
# `script/Counter.s.sol:CounterScript` 指定要执行的脚本文件及其内的脚本合约
# `--rpc-url $(grep SEPOLIA_URL .env | cut -d '=' -f2)` 从 .env 文件中提取 SEPOLIA_URL 的值作为 RPC 节点地址
# `grep SEPOLIA_URL .env` 用于在 .env 文件中查找包含 SEPOLIA_URL 的行
# `cut -d '=' -f2` 以 '=' 为分隔符，提取等号后的第二部分内容
# `--private-key $(grep PRIVATE_KEY .env | cut -d '=' -f2)` 从 .env 文件中提取 PRIVATE_KEY 的值作为部署使用的私钥
# `--broadcast` 表示将脚本中的交易广播到网络上实际执行部署操作

# 或者先加载环境变量再部署
source .env
forge script script/Counter.s.sol:CounterScript --rpc-url $SEPOLIA_URL --private-key $PRIVATE_KEY --broadcast
```

Counter合约部署完成！
合约地址:  0x75908E6fA69f88CB30fB62C26E8c6e9674C402DD
CounterOptimized合约部署完成！
合约地址:  0xFEeDE0C07608525F509bFfb4f08F814820Ee0929

部署脚本会自动：
1. 从.env文件读取Sepolia测试网RPC URL和私钥
2. 部署Counter原始版本合约
3. 部署CounterOptimized优化版本合约
4. 输出合约地址和部署者信息

### 部署单个合约

如果你只想部署单个合约，可以使用部署脚本中的特定函数：

```shell
# 只部署原始版本合约
forge script script/Counter.s.sol:CounterScript --sig "deployCounter()" --rpc-url $(grep SEPOLIA_URL .env | cut -d '=' -f2) --private-key $(grep PRIVATE_KEY .env | cut -d '=' -f2) --broadcast

# 只部署优化版本合约
forge script script/Counter.s.sol:CounterScript --sig "deployCounterOptimized()" --rpc-url $(grep SEPOLIA_URL .env | cut -d '=' -f2) --private-key $(grep PRIVATE_KEY .env | cut -d '=' -f2) --broadcast
```

## 验证已部署合约功能

项目提供了验证脚本，用于测试已部署的CounterOptimized合约的功能是否正常。验证脚本会自动测试合约的主要功能，包括读取计数值、增加计数、增加指定值、减少计数和重置计数。

### 运行验证脚本

```shell
# 使用.env文件中的配置运行验证脚本
forge script script/VerifyCounterOptimized.s.sol:VerifyCounterOptimized --rpc-url $(grep SEPOLIA_URL .env | cut -d '=' -f2) --private-key $(grep PRIVATE_KEY .env | cut -d '=' -f2) --broadcast

# 或者先加载环境变量再运行
source .env
forge script script/VerifyCounterOptimized.s.sol:VerifyCounterOptimized --rpc-url $SEPOLIA_URL --private-key $PRIVATE_KEY --broadcast
```

验证脚本会执行以下测试：
1. 读取当前计数值
2. 调用increment函数增加计数(+1)
3. 调用add函数增加指定值(+5)
4. 调用decrement函数减少计数(-1)
5. 调用reset函数重置计数(设为0)

每次测试都会显示当前值、预期结果和测试是否通过的信息。

## 测试覆盖率查看

Foundry 提供了测试覆盖率分析功能，可以查看合约代码的测试覆盖情况，包括行覆盖率、语句覆盖率、分支覆盖率和函数覆盖率。

### 查看测试覆盖率

```shell
# 查看所有文件的测试覆盖率
forge coverage

# 排除测试文件，只显示合约和脚本的测试覆盖率
forge coverage --exclude-tests

# 查看特定合约的测试覆盖率
forge coverage --match-contract CounterOptimizedGasTest
```

覆盖率报告包含以下指标：
- 行覆盖率：已测试的代码行数占总行数的百分比
- 语句覆盖率：已测试的语句数占总语句数的百分比
- 分支覆盖率：已测试的分支数占总分支数的百分比
- 函数覆盖率：已测试的函数数占总函数数的百分比

目前我们的合约测试覆盖率已经达到：
- Counter.sol：100.00% 行覆盖率、100.00% 语句覆盖率、100.00% 分支覆盖率、100.00% 函数覆盖率
- CounterOptimized.sol：100.00% 行覆盖率、100.00% 语句覆盖率、100.00% 分支覆盖率、100.00% 函数覆盖率

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
