module.exports = async ({ getNamedAccounts, deployments }) => {
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  await deploy('MyERC20', {
    from: deployer,
    args: [],
    log: true,
    autoMine: true,
  });
};

module.exports.tags = ['MyERC20'];