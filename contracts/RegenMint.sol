// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract Revenants is ERC721, Ownable, ReentrancyGuard {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;
    
    IERC1155 public immutable renaissanceContract;
    uint256 public constant TOTAL_TOKENS = 10;
    uint256 public constant START_TOKEN_ID = 0;
    uint256 public constant END_TOKEN_ID = 9;
    uint256 public constant MAX_SUPPLY = 66;
    
    // Mapping pour suivre combien de NFTs chaque adresse a minté
    mapping(address => uint256) public mintedPerWallet;
    
    event NFTMinted(address indexed to, uint256 tokenId);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
    
    constructor(address _renaissanceContract) ERC721("Re:venants", "REVE") Ownable(msg.sender) {
        renaissanceContract = IERC1155(_renaissanceContract);
    }
    
    function mint(uint256 quantity) external nonReentrant {
        require(quantity > 0, "Invalid quantity");
        require(_tokenIds.current() + quantity <= MAX_SUPPLY, "Would exceed max supply");
        
        // Si l'appelant n'est pas le propriétaire, vérifier les conditions supplémentaires
        if (msg.sender != owner()) {
            require(hasCompleteSet(msg.sender), "No complete set found");
            require(mintedPerWallet[msg.sender] + quantity <= getMaxMintable(msg.sender), "Exceeds maximum allowed for your sets");
        }
        
        // Mint NFT(s)
        for (uint256 i = 0; i < quantity; i++) {
            _tokenIds.increment();
            uint256 newTokenId = _tokenIds.current();
            _safeMint(msg.sender, newTokenId);
            
            emit NFTMinted(msg.sender, newTokenId);
        }
        
        // Mettre à jour le compteur seulement pour les non-propriétaires
        if (msg.sender != owner()) {
            mintedPerWallet[msg.sender] += quantity;
        }
    }
    
    // Fonction pour que le propriétaire puisse minter plusieurs NFTs à la fois
    function ownerMint(address to, uint256 quantity) external onlyOwner {
        require(quantity > 0, "Invalid quantity");
        require(_tokenIds.current() + quantity <= MAX_SUPPLY, "Would exceed max supply");
        
        for (uint256 i = 0; i < quantity; i++) {
            _tokenIds.increment();
            uint256 newTokenId = _tokenIds.current();
            _safeMint(to, newTokenId);
            
            emit NFTMinted(to, newTokenId);
        }
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

    function getMaxMintable(address wallet) public view returns (uint256) {
        if (!hasCompleteSet(wallet)) {
            return 0;
        }
        
        // Trouver le nombre minimum de chaque token possédé
        uint256 minBalance = type(uint256).max;
        for (uint256 i = START_TOKEN_ID; i <= END_TOKEN_ID; i++) {
            uint256 balance = renaissanceContract.balanceOf(wallet, i);
            if (balance < minBalance) {
                minBalance = balance;
            }
        }
        
        return minBalance;
    }
    
    function withdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No balance to withdraw");
        
        (bool success, ) = owner().call{value: balance}("");
        require(success, "Transfer failed");
    }
    
    function totalSupply() external view returns (uint256) {
        return _tokenIds.current();
    }
    
    function _baseURI() internal pure override returns (string memory) {
        return "https://api.yourdomain.com/metadata/revenants/"; // À remplacer par votre URI de métadonnées
    }
} 
