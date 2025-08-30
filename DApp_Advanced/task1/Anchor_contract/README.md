# Solana 计数器合约 (Anchor)

这是一个使用Anchor框架开发的简单Solana计数器合约。

## 功能特性

- 初始化计数器
- 增加计数
- 减少计数
- 设置计数到指定值

## 环境要求

- Rust (https://www.rust-lang.org/tools/install)
- Solana CLI (https://docs.solana.com/cli/install-solana-cli-tools)
- Node.js 和 npm/yarn
- Anchor (https://www.anchor-lang.com/docs/installation)

## 安装依赖

1. 安装Rust、Solana CLI和Node.js
2. 安装Anchor CLI:
```bash
cargo install --git https://github.com/coral-xyz/anchor avm --locked --force
avm install latest
avm use latest
```
3. 安装项目依赖:
```bash
npm install
# 或
# yarn install
```

## 编译合约

```bash
anchor build
```

编译成功后，会在 `target/deploy` 目录下生成 `.so` 文件和 `.idl` 文件。

## 运行测试

```bash
anchor test
```

## 部署合约

1. 确保你有一个Solana钱包，并且有足够的SOL用于部署:
```bash
solana-keygen new --outfile ~/.config/solana/id.json
solana airdrop 2
```

2. 部署合约:
```bash
anchor deploy
```

## 合约功能说明

### 初始化计数器

```rust
// 初始化计数器，设置初始值为0
pub fn initialize(ctx: Context<Initialize>) -> Result<()>
```

### 增加计数

```rust
// 计数器加1
pub fn increment(ctx: Context<Increment>) -> Result<()>
```

### 减少计数

```rust
// 计数器减1
pub fn decrement(ctx: Context<Decrement>) -> Result<()>
```

### 设置计数

```rust
// 设置计数器为指定值
pub fn set(ctx: Context<Set>, new_count: u64) -> Result<()>
```

## 项目结构

- `programs/counter/src/lib.rs`: 合约主要代码
- `tests/counter.ts`: 合约测试代码
- `Anchor.toml`: Anchor项目配置
- `Cargo.toml`: Rust项目配置

## 使用示例

安装依赖后，你可以使用以下命令与合约交互:

```bash
# 编译
anchor build

# 测试
anchor test

# 部署
anchor deploy
```

## 注意事项

1. 确保在测试前启动本地Solana集群:
```bash
solana-test-validator
```

2. 如果你使用的是Windows系统，可能需要在WSL(Windows Subsystem for Linux)中运行Anchor命令。

3. 部署到主网前，请确保你已经更新了Anchor.toml中的网络配置。