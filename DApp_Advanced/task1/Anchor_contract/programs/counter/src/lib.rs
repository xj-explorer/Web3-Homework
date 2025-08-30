use anchor_lang::prelude::*;

// 声明程序ID
declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");

// 定义计数器程序
#[program]
pub mod counter {
    use super::*;

    // 初始化计数器
    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        let counter = &mut ctx.accounts.counter;
        counter.count = 0;
        Ok(())
    }

    // 增加计数
    pub fn increment(ctx: Context<Increment>) -> Result<()> {
        let counter = &mut ctx.accounts.counter;
        counter.count = counter.count.checked_add(1).unwrap();
        Ok(())
    }

    // 减少计数
    pub fn decrement(ctx: Context<Decrement>) -> Result<()> {
        let counter = &mut ctx.accounts.counter;
        counter.count = counter.count.checked_sub(1).unwrap();
        Ok(())
    }

    // 设置计数
    pub fn set(ctx: Context<Set>, new_count: u64) -> Result<()> {
        let counter = &mut ctx.accounts.counter;
        counter.count = new_count;
        Ok(())
    }
}

// 初始化上下文
#[derive(Accounts)]
pub struct Initialize<'info> {
    // 计数器账户
    #[account(init, payer = user, space = 8 + 8)]
    pub counter: Account<'info, Counter>,
    // 用户账户
    #[account(mut)]
    pub user: Signer<'info>,
    // 系统程序
    pub system_program: Program<'info, System>,
}

// 增加计数上下文
#[derive(Accounts)]
pub struct Increment<'info> {
    // 计数器账户
    #[account(mut)]
    pub counter: Account<'info, Counter>,
}

// 减少计数上下文
#[derive(Accounts)]
pub struct Decrement<'info> {
    // 计数器账户
    #[account(mut)]
    pub counter: Account<'info, Counter>,
}

// 设置计数上下文
#[derive(Accounts)]
pub struct Set<'info> {
    // 计数器账户
    #[account(mut)]
    pub counter: Account<'info, Counter>,
}

// 计数器账户结构
#[account]
pub struct Counter {
    pub count: u64,
}