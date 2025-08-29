const { ethers, upgrades } = require("hardhat");
const { expect } = require("chai");

describe("CounterUpgradeable", function () {
    let counterProxy;
    let counterImplementation;
    let owner;
    let otherAccount;

    beforeEach(async function () {
        // 获取Hardhat环境中的测试账户，将第一个账户赋值给owner，第二个账户赋值给otherAccount
        // owner 通常作为合约的部署者和拥有者，otherAccount 用于模拟其他用户
        [owner, otherAccount] = await ethers.getSigners();

        // 通过合约名称 "CounterUpgradeable" 获取合约工厂实例
        // 合约工厂用于创建合约实例，是部署合约的前置步骤
        const CounterUpgradeable = await ethers.getContractFactory("CounterUpgradeable");
        
        // 使用 OpenZeppelin 的 upgrades 库部署一个可升级的代理合约
        // 第一个参数是合约工厂实例，第二个参数是初始化函数的参数数组，这里为空数组
        // initializer 指定初始化函数的名称为 "initialize"，kind 指定代理类型为 "uups"
        counterProxy = await upgrades.deployProxy(CounterUpgradeable, [], { 
            initializer: "initialize", 
            kind: "uups" 
        });
        
        // 等待代理合约部署完成，确保合约在区块链上成功创建
        await counterProxy.waitForDeployment();
        
        // 获取代理合约的地址，后续需要使用该地址来获取实现合约的地址
        const proxyAddress = await counterProxy.getAddress();
        
        // 使用 OpenZeppelin 的 erc1967 工具库，通过代理合约地址获取对应的实现合约地址
        // 可升级合约模式中，代理合约负责转发调用，实现合约包含实际的业务逻辑
        counterImplementation = await upgrades.erc1967.getImplementationAddress(proxyAddress);
    });

    describe("部署测试", function () {
        it("应该正确初始化计数值为0", async function () {
            expect(await counterProxy.getCount()).to.equal(0);
        });

        it("应该设置正确的合约拥有者", async function () {
            expect(await counterProxy.owner()).to.equal(owner.address);
        });
    });

    describe("基本功能测试", function () {
        it("应该能够增加计数", async function () {
            await counterProxy.increment();
            expect(await counterProxy.getCount()).to.equal(1);
        });

        it("应该能够减少计数", async function () {
            await counterProxy.increment();
            await counterProxy.increment();
            await counterProxy.decrement();
            expect(await counterProxy.getCount()).to.equal(1);
        });

        it("应该能够重置计数", async function () {
            await counterProxy.increment();
            await counterProxy.reset();
            expect(await counterProxy.getCount()).to.equal(0);
        });

        it("当计数为0时，应该拒绝减少计数", async function () {
            await expect(counterProxy.decrement()).to.be.revertedWith("Count cannot be negative");
        });

        it("当计数为0时，应该拒绝重置计数", async function () {
            await expect(counterProxy.reset()).to.be.revertedWith("Count must be greater than 0");
        });
    });

    describe("事件测试", function () {
        it("当增加计数时，应该触发CountChanged事件", async function () {
            await expect(counterProxy.increment())
                .to.emit(counterProxy, "CountChanged")
                .withArgs("increment", 1);
        });
        
        it("当减少计数时，应该触发CountChanged事件", async function () {
            await counterProxy.increment();
            
            await expect(counterProxy.decrement())
                .to.emit(counterProxy, "CountChanged")
                .withArgs("decrement", 0);
        });
        
        it("当重置计数时，应该触发CountChanged事件", async function () {
            await counterProxy.increment();
            
            await expect(counterProxy.reset())
                .to.emit(counterProxy, "CountChanged")
                .withArgs("reset", 0);
        });
    });

    describe("合约升级测试", function () {
        let counterProxyAfterUpgrade;
        let newImplementation;
        
        beforeEach(async function () {
            // 先执行一些操作，以便在升级后可以验证状态是否保留
            await counterProxy.increment();
            await counterProxy.increment();
            await counterProxy.increment();
            
            // 获取当前的计数值，用于升级后验证
            const currentCount = await counterProxy.getCount();
            
            // 升级到Counter_v2
            const Counter_v2 = await ethers.getContractFactory("Counter_v2");
            // counterProxy.getAddress() 用于获取代理合约在区块链上的地址。在可升级合约模式中，
            // 代理合约负责转发调用，该地址是升级合约时必须提供的参数，用于指定要升级的目标代理合约。
            await upgrades.upgradeProxy(await counterProxy.getAddress(), Counter_v2);
            
            // 获取升级后的代理合约实例
            // 使用 Counter_v2 合约工厂的 attach 方法，将代理合约地址绑定到 Counter_v2 合约实例上
            // 在可升级合约模式中，代理合约地址在升级前后不会改变，改变的是其指向的实现合约地址
            // 升级后代理合约指向了新的实现合约（Counter_v2），通过 attach 方法可以创建一个新的合约实例，方便后续调用 Counter_v2 的方法
            counterProxyAfterUpgrade = Counter_v2.attach(await counterProxy.getAddress());
            
            // 获取新的实现合约地址
            newImplementation = await upgrades.erc1967.getImplementationAddress(await counterProxy.getAddress());
        });
        
        it("升级后应该保留原有的状态（计数值）", async function () {
            // 升级前，我们执行了3次increment，所以计数值应该是3
            expect(await counterProxyAfterUpgrade.getCount()).to.equal(3);
        });
        
        it("升级后实现合约地址应该改变", async function () {
            expect(newImplementation).to.not.equal(counterImplementation);
        });
        
        it("升级后应该可以调用重写的increment方法（每次增加2）", async function () {
            // 升级前计数值是3
            await counterProxyAfterUpgrade.increment();
            // 升级后每次增加2，所以应该是3+2=5
            expect(await counterProxyAfterUpgrade.getCount()).to.equal(5);
        });
        
        it("升级后应该可以调用新添加的helloWorld方法", async function () {
            const message = await counterProxyAfterUpgrade.helloWorld();
            expect(message).to.equal("Hello World from Counter_v2!");
        });
        
        it("升级后应该可以调用新添加的multiply方法", async function () {
            // 升级前计数值是3
            await counterProxyAfterUpgrade.multiply(2);
            // 3 * 2 = 6
            expect(await counterProxyAfterUpgrade.getCount()).to.equal(6);
        });
        
        it("升级后重写的reset方法应该触发两个事件", async function () {
            // 升级前计数值是3
            const tx = await counterProxyAfterUpgrade.reset();
            const receipt = await tx.wait();
            
            // 检查是否有两个CountChanged事件
            const events = receipt.logs
                .filter(async log => log.address === await counterProxyAfterUpgrade.getAddress())
                .map(log => {
                    try {
                        return counterProxyAfterUpgrade.interface.parseLog(log);
                    } catch {
                        return null;
                    }
                })
                .filter(event => event !== null && event.name === "CountChanged");
            
            expect(events).to.have.length(2);
            expect(events[0].args.action).to.equal("reset_v2");
            expect(events[0].args.newCount).to.equal(0);
            expect(events[1].args.action).to.equal("reset_amount");
            expect(events[1].args.newCount).to.equal(3);
        });
    });
});