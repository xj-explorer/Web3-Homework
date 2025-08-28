const { ethers } = require("hardhat");
const { expect } = require("chai");

// describe 函数是 Mocha 测试框架的核心函数，用于组织和分组测试用例
// 第一个参数是测试套件的名称，第二个参数是包含测试用例的回调函数
// 这里创建了一个名为 "Counter" 的顶级测试套件，用于测试 Counter 合约的所有功能
describe("Counter", function () {
    let counter;
    let owner;

    // beforeEach 是一个钩子函数，会在每个测试用例（it 函数）执行前运行
    // 这里用于在每个测试前部署一个新的合约实例，确保测试用例之间相互独立
    beforeEach(async function () {
        // 使用 ethers.getSigners() 方法从 Hardhat 网络获取所有可用的账户，这里通过数组解构将第一个账户赋值给 owner 变量
        [owner] = await ethers.getSigners();

        // 这里采用的是工厂模式进行部署。ethers.getContractFactory 方法获取 Counter 合约的工厂实例
        // 合约工厂用于创建和部署合约实例，传入的参数 "Counter" 是合约的名称
        // 合约工厂可用于创建和部署合约实例，这是典型的工厂模式应用。
        const Counter = await ethers.getContractFactory("Counter");
        
        // 调用合约工厂的 deploy() 方法部署 Counter 合约
        // 该方法会返回一个合约部署对象，赋值给 counter 变量
        counter = await Counter.deploy();
        
        // 调用合约部署对象的 waitForDeployment() 方法等待合约部署完成
        // 此方法会返回一个 Promise，确保在合约部署成功后再继续执行后续操作
        await counter.waitForDeployment();
    });

    // describe 函数的嵌套用法：在主测试套件内创建子测试套件
    // 这种嵌套结构可以更好地组织测试用例，按功能模块进行分组
    // 这里创建了一个名为 "Deployment" 的子测试套件，专门测试合约部署相关功能
    describe("Deployment", function () {
        // 测试合约部署后初始计数是否为 0
        // 调用合约的 getCount 方法获取当前计数，并使用 chai 的 expect 断言其值等于 0
        it("Should set the initial count to 0", async function () {
            expect(await counter.getCount()).to.equal(0);
        });

        // 测试合约是否由 owner 账户部署
        // 通过获取合约的 runner 地址，并使用 chai 的 expect 断言该地址与 owner 地址相等
        it("Should be deployed by the owner", async function () {
            expect(await counter.runner.address).to.equal(owner.address);
        });
    });

    // 创建名为 "Increment" 的子测试套件，专门测试 increment 功能
    describe("Increment", function () {
        it("Should increment the count by 1", async function () {
            await counter.increment();
            expect(await counter.getCount()).to.equal(1);
            
            await counter.increment();
            expect(await counter.getCount()).to.equal(2);
        });

        it("Should emit CountChanged event when incrementing", async function () {
            await expect(counter.increment())
                .to.emit(counter, "CountChanged")
                .withArgs("increment", 1);
        });
    });

    // 创建名为 "Decrement" 的子测试套件，专门测试 decrement 功能
    describe("Decrement", function () {
        it("Should decrement the count by 1 when count is greater than 0", async function () {
            await counter.increment();
            await counter.increment();
            expect(await counter.getCount()).to.equal(2);
            
            await counter.decrement();
            expect(await counter.getCount()).to.equal(1);
            
            await counter.decrement();
            expect(await counter.getCount()).to.equal(0);
        });

        it("Should emit CountChanged event when decrementing", async function () {
            await counter.increment();
            
            await expect(counter.decrement())
                .to.emit(counter, "CountChanged")
                .withArgs("decrement", 0);
        });

        it("Should revert when trying to decrement below 0", async function () {
            await expect(counter.decrement()).to.be.revertedWith("Count cannot be negative");
        });
    });

    // 创建名为 "Reset" 的子测试套件，专门测试 reset 功能
    describe("Reset", function () {
        it("Should reset the count to 0 when count is greater than 0", async function () {
            await counter.increment();
            await counter.decrement();
            await expect(counter.reset()).to.be.revertedWith("Count must be greater than 0");
        });

        it("Should reset the count to 0", async function () {
            await counter.increment();
            await counter.increment();
            await counter.increment();
            expect(await counter.getCount()).to.equal(3);
            
            await counter.reset();
            expect(await counter.getCount()).to.equal(0);
        });

        it("Should emit CountChanged event when resetting", async function () {
            await counter.increment();
            
            await expect(counter.reset())
                .to.emit(counter, "CountChanged")
                .withArgs("reset", 0);
        });
    });
});