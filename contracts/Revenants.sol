// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

contract Revenants is ERC721, Ownable, ReentrancyGuard {
    using Counters for Counters.Counter;
    using Strings for uint256;
    Counters.Counter private _tokenIds;
    uint256 public constant MAX_SUPPLY = 66;
    
    IERC1155 public immutable renaissanceContract;
    uint256 private constant TOTAL_TOKENS = 10;
    uint256 private constant START_TOKEN_ID = 0;
    uint256 private constant END_TOKEN_ID = 9;
    
    // Mapping to track how many NFTs each address has minted
    mapping(address => uint256) public mintedPerWallet;
    
    event NFTMinted(address indexed to, uint256 tokenId);
    
    constructor(address _renaissanceContract) ERC721("(Re:)venants", "RVNT") Ownable(msg.sender) {
        renaissanceContract = IERC1155(_renaissanceContract);
        _baseTokenURI = "ipfs://URI_TO_RREPLACE/";
    }
    
    function mint(uint256 quantity) external nonReentrant {
        require(quantity > 0, "Invalid quantity");
        require(_tokenIds.current() + quantity <= MAX_SUPPLY, "Would exceed max supply");
        
        // If caller is not the owner, check additional conditions
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
        
        // Update counter only for non-owners
        if (msg.sender != owner()) {
            mintedPerWallet[msg.sender] += quantity;
        }
    }
    
    // Function for owner to mint multiple NFTs at once
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
        // Check if user has at least one of each token
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
        
        // Find the minimum number of each token owned
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
    
    // Variable to store base URI
    string private _baseTokenURI;
    
    // Function to set base URI
    function setBaseURI(string memory baseURI) external onlyOwner {
        _baseTokenURI = baseURI;
    }
    
    // Override _baseURI function to use _baseTokenURI variable
    function _baseURI() internal view override returns (string memory) {
        return _baseTokenURI;
    }
    
    // Override tokenURI function to add .json extension
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        // Check if token exists using ownerOf which throws an error if token doesn't exist
        // instead of using _exists which is no longer available
        ownerOf(tokenId); // This line will throw if token doesn't exist
        
        string memory baseURI = _baseURI();
        return bytes(baseURI).length > 0 ? string(abi.encodePacked(baseURI, tokenId.toString(), ".json")) : "";
    }
} 
