// Counter合约的Hardhat Ignition部署模块
// Hardhat Ignition是Hardhat v2版本引入的官方部署工具，提供了声明式的合约部署方式
// 详细文档：https://hardhat.org/ignition

// 导入buildModule函数，这是创建Ignition部署模块的核心函数
// buildModule函数允许定义合约部署的依赖关系和参数
const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

// 定义并导出CounterModule部署模块
// 第一个参数是模块名称（CounterModule），用于在Ignition系统中标识这个部署模块
// 第二个参数是一个回调函数，接收一个模块参数对象（m），用于定义部署步骤
module.exports = buildModule("CounterModule", (m) => {
  // 使用m.contract方法部署Counter合约
  // 参数为合约名称（"Counter"），这里没有传递构造函数参数（因为Counter合约没有构造函数）
  // 此函数返回一个合约部署对象，代表了Counter合约的部署过程
  // m.contract 方法通过传入的合约名称 "Counter" 来识别要部署的合约。
  // Hardhat Ignition 会在项目的合约目录（通常是 contracts 文件夹）中查找名为 Counter.sol 的文件，
  // 并从中编译出对应的 Counter 合约进行部署。
  const counter = m.contract("Counter");
  
  // 返回一个对象，包含了部署的合约实例
  // 这样在部署完成后，可以通过这个返回对象访问已部署的合约
  return { counter };
});