// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

module.exports = buildModule("CCIPTokenTransferModule", (m) => {
  // 参数定义：路由器地址
  const routerAddress = m.getParameter("routerAddress");
  
  // 部署Receiver合约
  const receiver = m.contract("CrossChainTokenTransferReceiver", [routerAddress]);
  
  // 部署Sender合约
  const sender = m.contract("CrossChainTokenTransferSender", [routerAddress]);
  
  return { receiver, sender };
});