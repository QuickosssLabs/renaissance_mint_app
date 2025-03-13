// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract RenaissanceTest is ERC1155, Ownable {
    uint256 public constant PRICE = 0.0001 ether; // Prix réduit pour les tests
    uint256 public constant MAX_SUPPLY = 1000;
    uint256 public constant MAX_PER_WALLET = 30; // Augmenté pour permettre 3 sets complets
    uint256 public constant TOTAL_TOKENS = 10; // Nombre total de tokens différents
    uint256 public constant SET_SIZE = 10; // Taille d'un set complet
    uint256 public totalMinted;
    
    // Mapping pour suivre le supply total par token
    mapping(uint256 => uint256) private _totalSupply;

    constructor() ERC1155("https://api.example.com/token/{id}") Ownable(msg.sender) {}

    function mint(uint256 tokenId, uint256 amount) external payable {
        require(tokenId < TOTAL_TOKENS, "Invalid token ID");
        require(msg.value == PRICE * amount, "Incorrect payment");
        require(totalMinted + amount <= MAX_SUPPLY, "Max supply reached");
        require(balanceOf(msg.sender, tokenId) + amount <= MAX_PER_WALLET, "Max per wallet reached");

        _mint(msg.sender, tokenId, amount, "");
        totalMinted += amount;
        _totalSupply[tokenId] += amount;
    }

    function mintBatch(uint256[] calldata tokenIds, uint256[] calldata amounts) external payable {
        require(tokenIds.length == amounts.length, "Arrays length mismatch");
        
        uint256 totalCost = 0;
        for(uint256 i = 0; i < tokenIds.length; i++) {
            require(tokenIds[i] < TOTAL_TOKENS, "Invalid token ID");
            totalCost += PRICE * amounts[i];
        }
        
        require(msg.value == totalCost, "Incorrect payment");
        
        for(uint256 i = 0; i < tokenIds.length; i++) {
            require(balanceOf(msg.sender, tokenIds[i]) + amounts[i] <= MAX_PER_WALLET, "Max per wallet reached");
        }
        
        require(totalMinted + totalCost/PRICE <= MAX_SUPPLY, "Max supply reached");
        
        _mintBatch(msg.sender, tokenIds, amounts, "");
        totalMinted += totalCost/PRICE;
        
        // Mise à jour du supply total pour chaque token
        for(uint256 i = 0; i < tokenIds.length; i++) {
            _totalSupply[tokenIds[i]] += amounts[i];
        }
    }

    function withdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        payable(owner()).transfer(balance);
    }

    /**
     * @dev Returns the total supply of a specific token
     */
    function totalSupply(uint256 id) public view returns (uint256) {
        return _totalSupply[id];
    }

    /**
     * @dev Returns the URI for a given token ID
     */
    function uri(uint256 id) public view override returns (string memory) {
        return super.uri(id);
    }
} 