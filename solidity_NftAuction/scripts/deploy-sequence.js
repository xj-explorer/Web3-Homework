// const { exec } = require('child_process');
// const fs = require('fs');
// const path = require('path');

// // 部署脚本顺序
// const deployScripts = [
//   '01-deploy-nft.js',
//   '02-deploy-erc20.js',
//   '03-deploy-auction-upgradeable.js',
//   '04-deploy-auction-v2.js',
//   '05-deploy-factory-upgradeable.js'
// ];

// // 存储所有部署的合约地址
// const deployedContracts = {};

// // 为每个部署脚本创建单独的日志对象
// const scriptLogs = {};

// deployScripts.forEach(script => {
//   scriptLogs[script] = {
//     command: '',
//     output: '',
//     error: '',
//     contracts: {},
//     timestamp: new Date().toISOString(),
//     success: false
//   };
// });

// // 改进的合约地址提取模式
// const contractPatterns = [
//   /(Contract|Implementation|Proxy)\s+([A-Za-z0-9]+)\s+deployed\s+to\s+(0x[a-fA-F0-9]{40})/,
//   /(0x[a-fA-F0-9]{40})\s+-\s+([A-Za-z0-9]+)/,
//   /([A-Za-z0-9]+)\s+address:\s+(0x[a-fA-F0-9]{40})/,
//   /Deploying\s+([A-Za-z0-9]+)\s+to\s+(0x[a-fA-F0-9]{40})/
// ];

// // 执行部署命令的函数
// function runDeployCommand(scriptName) {
//   return new Promise((resolve, reject) => {
//     console.log(`\n===== 开始部署: ${scriptName} =====`);
    
//     // 初始化该脚本的日志
//     scriptLogs[scriptName] = {
//       command: '',
//       output: '',
//       error: '',
//       contracts: {},
//       timestamp: new Date().toISOString(),
//       success: false
//     };
    
//     try {
//       // 使用hardhat-deploy的文件路径功能来执行特定脚本
//       const scriptPath = path.join('deploy', scriptName);
//       const command = `npx hardhat deploy --network sepolia --deploy-scripts ${scriptPath}`;
//       console.log(`执行命令: ${command}`);
      
//       // 保存命令到日志
//       scriptLogs[scriptName].command = command;

//       const deployProcess = exec(command, { cwd: process.cwd() });

//       // 捕获标准输出
//       deployProcess.stdout.on('data', (data) => {
//         const dataStr = data.toString();
//         scriptLogs[scriptName].output += dataStr;
//         console.log(dataStr.trim());

//         // 尝试提取合约地址
//         contractPatterns.forEach(pattern => {
//           const matches = dataStr.match(pattern);
//           if (matches) {
//             let contractName, address;
            
//             // 根据不同模式提取名称和地址
//             if (pattern === contractPatterns[0]) {
//               contractName = matches[2];
//               address = matches[3];
//             } else if (pattern === contractPatterns[1]) {
//               address = matches[1];
//               contractName = matches[2];
//             } else if (pattern === contractPatterns[2]) {
//               contractName = matches[1];
//               address = matches[2];
//             } else if (pattern === contractPatterns[3]) {
//               contractName = matches[1];
//               address = matches[2];
//             }
            
//             // 保存到全局对象和脚本特定对象
//             deployedContracts[contractName] = address;
//             scriptLogs[scriptName].contracts[contractName] = address;
//           }
//         });
//       });

//       // 捕获错误输出
//       deployProcess.stderr.on('data', (data) => {
//         const dataStr = data.toString();
//         console.error(dataStr.trim());
//         scriptLogs[scriptName].error += dataStr;
//       });

//       // 命令完成时
//       deployProcess.on('close', (code) => {
//         if (code === 0) {
//           console.log(`===== 部署成功: ${scriptName} =====`);
//           scriptLogs[scriptName].success = true;
          
//           // 显示该脚本部署的合约地址
//           console.log('\n--- 本脚本部署的合约地址 ---');
//           for (const [name, address] of Object.entries(scriptLogs[scriptName].contracts)) {
//             console.log(`${name}: ${address}`);
//           }
//           console.log('------------------------\n');
          
//           // 保存该脚本的日志到单独文件
//           const logFileName = path.join(__dirname, `${scriptName.replace('.js', '')}-log.json`);
//           fs.writeFileSync(logFileName, JSON.stringify(scriptLogs[scriptName], null, 2));
//           console.log(`📝 部署日志已保存到: ${logFileName}`);
          
//           resolve();
//         } else {
//           console.error(`===== 部署失败: ${scriptName} =====`);
//           scriptLogs[scriptName].success = false;
          
//           // 保存失败日志
//           const logFileName = path.join(__dirname, `${scriptName.replace('.js', '')}-log.json`);
//           fs.writeFileSync(logFileName, JSON.stringify(scriptLogs[scriptName], null, 2));
//           console.log(`📝 部署日志已保存到: ${logFileName}`);
          
//           reject(new Error(`部署脚本 ${scriptName} 失败，退出码: ${code}`));
//         }
//       });
//     } catch (error) {
//       console.error(`===== 部署失败: ${scriptName} =====`);
//       console.error(error);
//       scriptLogs[scriptName].success = false;
//       scriptLogs[scriptName].error += `\nEXCEPTION: ${error.message}`;
      
//       // 保存错误日志
//       const logFileName = path.join(__dirname, `${scriptName.replace('.js', '')}-log.json`);
//       fs.writeFileSync(logFileName, JSON.stringify(scriptLogs[scriptName], null, 2));
      
//       reject(error);
//     }
//   });
// }

// // 按顺序执行所有部署脚本
// async function deployInSequence() {
//   console.log('开始按顺序部署合约...');

//   try {
//     for (const script of deployScripts) {
//       await runDeployCommand(script);
//     }

//     // 保存所有合约地址到汇总文件
//     const addressesFileName = path.join(__dirname, 'deployed-addresses.json');
//     fs.writeFileSync(addressesFileName, JSON.stringify(deployedContracts, null, 2));
    
//     console.log('\n所有合约部署完成!');
//     console.log('\n=== 所有部署的合约地址汇总 ===');
//     for (const [name, address] of Object.entries(deployedContracts)) {
//       console.log(`${name}: ${address}`);
//     }
//     console.log('============================\n');
//     console.log(`地址已保存到: ${addressesFileName}`);
    
//     // 保存所有脚本日志汇总
//     const allLogsFileName = path.join(__dirname, 'all-deploy-logs.json');
//     fs.writeFileSync(allLogsFileName, JSON.stringify(scriptLogs, null, 2));
//     console.log(`所有部署日志已汇总保存到: ${allLogsFileName}`);
//   } catch (error) {
//     console.error('部署过程中出错:', error);
//     process.exit(1);
//   }
// }

// // 执行部署
// deployInSequence();