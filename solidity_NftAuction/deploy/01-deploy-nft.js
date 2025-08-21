module.exports = async ({ getNamedAccounts, deployments }) => {
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  await deploy('MyNFT', {
    from: deployer,
    args: [],
    log: true,
    autoMine: true,
  });
};

module.exports.tags = ['MyNFT'];