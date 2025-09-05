const { expect } = require('chai');
const { ethers } = require('hardhat');

describe('MyERC20', function () {
  let myERC20;
  let owner;
  let addr1;
  let addr2;

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();

    const MyERC20 = await ethers.getContractFactory('MyERC20');
    myERC20 = await MyERC20.deploy();
    await myERC20.waitForDeployment();
  });

  it('Should have correct initial supply', async function () {
    const totalSupply = await myERC20.totalSupply();
    expect(totalSupply).to.equal(ethers.parseEther('1000000'));

    const ownerBalance = await myERC20.balanceOf(owner.address);
    expect(ownerBalance).to.equal(totalSupply);
  });

  it('Should allow transfer of tokens', async function () {
    await myERC20.transfer(addr1.address, ethers.parseEther('100'));
    expect(await myERC20.balanceOf(addr1.address)).to.equal(ethers.parseEther('100'));

    await myERC20.connect(addr1).transfer(addr2.address, ethers.parseEther('50'));
    expect(await myERC20.balanceOf(addr1.address)).to.equal(ethers.parseEther('50'));
    expect(await myERC20.balanceOf(addr2.address)).to.equal(ethers.parseEther('50'));
  });

  it('Should allow minting of tokens by owner', async function () {
    await myERC20.mint(addr1.address, ethers.parseEther('1000'));
    expect(await myERC20.balanceOf(addr1.address)).to.equal(ethers.parseEther('1000'));
  });

  it('Should not allow minting of tokens by non-owner', async function () {
    await expect(
      myERC20.connect(addr1).mint(addr1.address, ethers.parseEther('1000'))
    ).to.be.revertedWithCustomError(myERC20, 'OwnableUnauthorizedAccount');
  });
});