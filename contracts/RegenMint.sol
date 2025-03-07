// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract RegenMint is ERC721, Ownable, ReentrancyGuard {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;
    
    IERC1155 public immutable renaissanceContract;
    uint256 public constant MINT_PRICE = 0.00001 ether;
    uint256 public constant TOTAL_TOKENS = 10;
    uint256 public constant START_TOKEN_ID = 0;
    uint256 public constant END_TOKEN_ID = 9;
    uint256 public constant MAX_SUPPLY = 66;
    
    // Mapping pour suivre combien de NFTs chaque adresse a minté
    mapping(address => uint256) public mintedPerWallet;
    
    event NFTMinted(address indexed to, uint256 tokenId);
    
    constructor(address _renaissanceContract) ERC721("RegenMint", "REGEN") Ownable(msg.sender) {
        renaissanceContract = IERC1155(_renaissanceContract);
    }
    
    function mint(uint256 quantity) external payable nonReentrant {
        require(quantity > 0 && quantity <= 1, "Invalid quantity");
        require(_tokenIds.current() + quantity <= MAX_SUPPLY, "Would exceed max supply");
        require(msg.value >= MINT_PRICE * quantity, "Insufficient payment");
        require(hasCompleteSet(msg.sender), "No complete set found");
        require(mintedPerWallet[msg.sender] + quantity <= 1, "Already minted maximum allowed");
        
        // Transfer ETH to owner
        (bool success, ) = owner().call{value: msg.value}("");
        require(success, "Transfer failed");
        
        // Mint NFT
        _tokenIds.increment();
        uint256 newTokenId = _tokenIds.current();
        _safeMint(msg.sender, newTokenId);
        
        mintedPerWallet[msg.sender] += quantity;
        emit NFTMinted(msg.sender, newTokenId);
    }
    
    function hasCompleteSet(address wallet) public view returns (bool) {
        // Vérifier que l'utilisateur a au moins un de chaque token
        for (uint256 i = START_TOKEN_ID; i <= END_TOKEN_ID; i++) {
            if (renaissanceContract.balanceOf(wallet, i) == 0) {
                return false;
            }
        }
        return true;
    }
    
    function withdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No balance to withdraw");
        
        (bool success, ) = owner().call{value: balance}("");
        require(success, "Transfer failed");
    }
    
    function _baseURI() internal pure override returns (string memory) {
        return "https://api.yourdomain.com/metadata/"; // À remplacer par votre URI de métadonnées
    }
} 