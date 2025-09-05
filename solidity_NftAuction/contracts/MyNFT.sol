// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

/**
 * @title MyNFT
 * @dev 实现一个基础的NFT合约，支持铸造和转移功能
 */
contract MyNFT is ERC721, Ownable {
    // 用于跟踪下一个可用的NFT token ID
    uint256 private _tokenIdCounter;
    // 基础URI，用于生成NFT元数据URI
    string private _baseTokenURI;
    // 为每个NFT存储单独的URI
    mapping(uint256 => string) private _tokenURIs;

    /**
     * @dev 构造函数，初始化NFT的名称和符号
     */
    constructor() ERC721("MyNFT", "MNFT") Ownable(msg.sender) {
        _tokenIdCounter = 0;
        _baseTokenURI = "https://example.com/api/nft/";
    }

    /**
     * @dev 设置NFT的基础URI
     * @param baseURI 新的基础URI字符串
     */
    function setBaseURI(string memory baseURI) public onlyOwner {
        _baseTokenURI = baseURI;
    }

    /**
     * @dev 返回NFT的tokenURI
     * 优先使用为该token设置的特定URI，如果没有则使用基础URI+tokenId
     * @param tokenId NFT的ID
     * @return string 完整的NFT元数据URI
     */
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        require(_ownerOf(tokenId) != address(0), "ERC721Metadata: URI query for nonexistent token");
        
        // 检查是否有特定的tokenURI
        string memory _tokenURI = _tokenURIs[tokenId];
        if (bytes(_tokenURI).length > 0) {
            return _tokenURI;
        }
        
        // 否则使用基础URI+tokenId
        return bytes(_baseTokenURI).length > 0 ? string(abi.encodePacked(_baseTokenURI, Strings.toString(tokenId))) : "";
    }
    
    /**
     * @dev 为特定的NFT设置单独的元数据URI
     * @param tokenId NFT的ID
     * @param _tokenURI NFT的元数据URI
     */
    function setTokenURI(uint256 tokenId, string memory _tokenURI) public onlyOwner {
        require(_ownerOf(tokenId) != address(0), "ERC721Metadata: URI set for nonexistent token");
        _tokenURIs[tokenId] = _tokenURI;
    }

    /**
     * @dev 铸造新的NFT
     * @param to 接收NFT的地址
     * @return tokenId 新铸造的NFT的ID
     */
    /**
     * @dev 铸造新的NFT
     * @param to 接收NFT的地址
     * @return tokenId 新铸造的NFT的ID
     */
    function safeMint(address to) public onlyOwner returns (uint256) {
        uint256 tokenId = _tokenIdCounter;
        _safeMint(to, tokenId);
        _tokenIdCounter++;
        return tokenId;
    }

    /**
     * @dev 铸造新的NFT并直接设置元数据URI
     * @param to 接收NFT的地址
     * @param _tokenURI NFT的元数据URI
     * @return tokenId 新铸造的NFT的ID
     */
    function safeMintWithURI(address to, string memory _tokenURI) public onlyOwner returns (uint256) {
        uint256 tokenId = _tokenIdCounter;
        _safeMint(to, tokenId);
        _tokenURIs[tokenId] = _tokenURI;
        _tokenIdCounter++;
        return tokenId;
    }
}