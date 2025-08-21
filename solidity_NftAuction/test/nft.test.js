const { expect } = require('chai');
const { ethers } = require('hardhat');

describe('MyNFT', function () {
  let myNFT;
  let owner;
  let addr1;
  let addr2;

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();

    const MyNFT = await ethers.getContractFactory('MyNFT');
    myNFT = await MyNFT.deploy();
    await myNFT.waitForDeployment();
  });

  it('Should mint NFTs to the owner', async function () {
    await myNFT.safeMint(owner.address, 'ipfs://example-uri-1');
    await myNFT.safeMint(addr1.address, 'ipfs://example-uri-2');

    expect(await myNFT.balanceOf(owner.address)).to.equal(1);
    expect(await myNFT.balanceOf(addr1.address)).to.equal(1);
    expect(await myNFT.balanceOf(addr2.address)).to.equal(0);

    expect(await myNFT.tokenURI(0)).to.equal('ipfs://example-uri-1');
    expect(await myNFT.tokenURI(1)).to.equal('ipfs://example-uri-2');
  });

  it('Should transfer NFTs between accounts', async function () {
    await myNFT.safeMint(owner.address, 'ipfs://example-uri-1');
    await myNFT.transferFrom(owner.address, addr1.address, 0);

    expect(await myNFT.balanceOf(owner.address)).to.equal(0);
    expect(await myNFT.balanceOf(addr1.address)).to.equal(1);
    expect(await myNFT.ownerOf(0)).to.equal(addr1.address);
  });

  it('Should not allow non-owners to transfer NFTs', async function () {
    await myNFT.safeMint(owner.address, 'ipfs://example-uri-1');

    await expect(
      myNFT.connect(addr1).transferFrom(owner.address, addr2.address, 0)
    ).to.be.revertedWithCustomError(myNFT, 'ERC721InsufficientApproval');
  });
});