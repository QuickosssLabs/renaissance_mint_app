# (Re:)venants NFT Project

[![Solidity](https://img.shields.io/badge/Solidity-%5E0.8.20-363636?logo=solidity)](https://docs.soliditylang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Network](https://img.shields.io/badge/Network-Base-blue)](https://base.org)

A Web3 application for minting (Re:)venants NFTs, requiring ownership and burning of (re:)naissance tokens.

## 📝 Overview

The (Re:)venants project (ERC721) is a unique NFT collection that implements a novel burn-to-mint mechanism: users must own and burn a complete set of (re:)naissance tokens (ERC1155) to be eligible for minting. The more complete sets a user owns, the more (Re:)venants NFTs they can mint.

## 📄 Smart Contract Details

### 🔍 Basic Information
- **Name**: (Re:)venants
- **Symbol**: RVNT
- **Standard**: ERC721
- **Max Supply**: 68 NFTs
- **Requirements**: Complete set of (re:)naissance tokens (10 different tokens, IDs 0-9)
- **Mint Mechanism**: Burn-to-mint (one complete set of Renaissance tokens per Revenant)

### ⭐ Key Features

#### 🔨 Minting Mechanism
- Users must own at least one complete set of (re:)naissance tokens
- Each mint requires burning one complete set of Renaissance tokens
- The number of NFTs a user can mint is equal to their minimum number of complete sets
- Contract owner can mint without requiring (re:)naissance tokens
- Built-in protection against reentrancy attacks
- Automatic balance verification before burning

#### 👑 Ownership Management (Ownable)
- `transferOwnership(address newOwner)`: Transfer contract ownership to a new address
- `renounceOwnership()`: Permanently renounce contract ownership (irreversible)
- `owner()`: View the current contract owner's address
- All owner-only functions are protected by the `onlyOwner` modifier

#### 🛠️ Functions
- `mint(uint256 quantity)`: Mint NFTs by burning complete sets of Renaissance tokens
- `ownerMint(address to, uint256 quantity)`: Owner-only function to mint NFTs for any address
- `hasCompleteSet(address wallet)`: Check if an address owns a complete set
- `getMaxMintable(address wallet)`: Get the maximum number of NFTs an address can mint
- `totalSupply()`: Get the current total supply of minted NFTs
- `setBaseURI(string)`: Update the base URI for token metadata
- `emergencyETHRecovery()`: Emergency function to recover ETH sent to the contract

### 🛡️ Security Features
- Reentrancy protection
- Owner-only functions for administrative tasks
- Supply cap enforcement
- Proper balance checks before burning
- Secure ownership management
- Emergency recovery functions
- Immutable Renaissance contract address

## 💻 Web Application

### ✨ Features
- Connect wallet button
- Automatic network detection and switching to Base Mainnet
- Real-time display of:
  - Wallet connection status
  - Number of complete sets owned
  - Maximum mintable NFTs
  - Current total supply
- Minting interface with quantity selection
- Clear warnings about the burn-to-mint mechanism
- Error handling and user feedback

### 🔧 Technical Stack
- Frontend: HTML, CSS, JavaScript
- Web3 Integration: ethers.js
- Network: Base Mainnet
- Smart Contract Interaction: Custom ABI integration

### ⚙️ Configuration
The application uses two main contracts:
1. **(re:)naissance Contract** (ERC1155)
   - Used to check token balances
   - Required for minting eligibility

2. **(Re:)venants Contract** (ERC721)
   - Handles the minting process
   - Manages NFT distribution

## 🚀 Setup and Usage

1. Connect your wallet to Base Mainnet
2. Ensure you have a complete set of (re:)naissance tokens
3. Be aware that minting will burn one complete set of Renaissance tokens per Revenant
4. Select the quantity of NFTs to mint (based on your eligible amount)
5. Confirm the transaction in your wallet

## ⚠️ Error Messages

The application handles various scenarios:
- Insufficient complete sets
- Network mismatch
- Wallet connection issues
- Maximum supply reached
- Invalid mint quantity
- Exceeds maximum mintable NFTs based on owned sets
- Insufficient balance for burning

## 🎨 Metadata

NFT metadata is stored on IPFS with the following base URI:
```
ipfs://bafybeiahj6xqgyead7fjhgra6rcsafvxnufqfp5yyjbwlh4ryu22asfkbm/
```

Each token's metadata is accessed by appending the token ID and `.json` to the base URI.

## 👨‍💻 Development

The project uses:
- Solidity ^0.8.20
- OpenZeppelin contracts for security and standards
- ethers.js for Web3 integration
- Modern JavaScript for frontend functionality

## 🛡️ Security Considerations

- All sensitive functions are protected with appropriate modifiers
- Reentrancy protection implemented
- Owner-only functions for administrative tasks
- Proper error handling and input validation
- Secure token existence verification 

## 📜 License

MIT License

Copyright (c) 2025 QuickosssLabs

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE. 
