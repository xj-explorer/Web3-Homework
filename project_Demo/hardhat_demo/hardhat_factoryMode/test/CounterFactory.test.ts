// SPDX-License-Identifier: MIT
import { expect } from "chai";
import { network } from "hardhat";

/**
 * CounterFactory合约测试套件
 * 使用Hardhat 3的正确ES模块语法
 */
const { ethers } = await network.connect();

describe("CounterFactory", function () {
    let counterFactory: any;
    let owner: any;
    let addr1: any;
    let addr2: any;

    // 在每个测试用例执行前部署合约
    beforeEach(async function () {
        try {
            // 获取签名者账户
            [owner, addr1, addr2] = await ethers.getSigners();

            // 部署CounterFactory合约
            counterFactory = await ethers.deployContract("CounterFactory", [], {
                from: owner.address
            });
            await counterFactory.waitForDeployment();
        } catch (error) {
            console.error("Setup error:", error);
            throw error;
        }
    });

    // 测试工厂合约部署
    describe("Deployment", function () {
        it("Should deploy successfully", async function () {
            const factoryAddress = await counterFactory.getAddress();
            expect(factoryAddress).to.not.be.undefined;
            expect(factoryAddress).to.not.be.empty;
        });

        it("Should have zero counters initially", async function () {
            const count = await counterFactory.getCountersCount();
            expect(count).to.equal(0);
        });
    });

    // 测试创建单个Counter合约
    describe("Counter Creation", function () {
        it("Should create a new Counter contract", async function () {
            // 创建Counter合约
            const tx = await counterFactory.createCounter();
            
            // 等待交易完成
            const receipt = await tx.wait();
            
            // 验证Counter合约地址不为空
            expect(receipt).to.not.be.undefined;
            
            // 验证计数器数量增加到1
            const count = await counterFactory.getCountersCount();
            expect(count).to.equal(1);
            
            // 验证通过索引获取的合约地址
            const counterAddress = await counterFactory.getCounter(0);
            expect(counterAddress).to.not.be.undefined;
            expect(counterAddress).to.not.be.empty;
        });
    });

    // 测试Counter合约的功能
    describe("Counter Functionality", function () {
        let counterAddress: string;

        beforeEach(async function () {
            // 创建一个Counter合约用于测试
            const tx = await counterFactory.createCounter();
            await tx.wait();
            
            // 获取Counter合约地址
            counterAddress = await counterFactory.getCounter(0);
        });

        it("Should increment Counter by 1 when calling inc()", async function () {
            // 连接到Counter合约
            const counter = await ethers.getContractAt("Counter", counterAddress);
            
            // 调用inc()函数
            await counter.inc();
            
            // 验证值增加了1
            const value = await counter.x();
            expect(value).to.equal(1n);
        });

        it("Should increment Counter by specified amount when calling incBy()", async function () {
            const incrementAmount = 5n;
            
            // 连接到Counter合约
            const counter = await ethers.getContractAt("Counter", counterAddress);
            
            // 调用incBy()函数
            await counter.incBy(incrementAmount);
            
            // 验证值增加了指定的数量
            const value = await counter.x();
            expect(value).to.equal(incrementAmount);
        });
    });
});