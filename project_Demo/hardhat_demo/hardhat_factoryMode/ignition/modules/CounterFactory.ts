// SPDX-License-Identifier: MIT
import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

/**
 * CounterFactory模块 - 部署工厂合约并展示其功能
 * 该模块部署CounterFactory合约并创建一个示例Counter合约
 * 部署后可以使用返回的工厂合约来创建和管理多个Counter合约
 */
export default buildModule("CounterFactoryModule", (m) => {
    // 部署CounterFactory合约
    const counterFactory = m.contract("CounterFactory");

    // 创建一个示例Counter合约作为部署验证
    m.call(counterFactory, "createCounter", []);

    // 返回部署的工厂合约，这样用户可以在部署后访问它
    return { counterFactory };
});