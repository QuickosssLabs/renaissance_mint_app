# (Re:)venants NFT Project

A Web3 application for minting (Re:)venants NFTs, requiring ownership of (re:)naissance tokens.

## Overview

The (Re:)venants project is a unique NFT collection that implements a novel minting mechanism: users must own a complete set of (re:)naissance tokens (ERC1155) to be eligible for minting. The more complete sets a user owns, the more (Re:)venants NFTs they can mint.

## Smart Contract Details

### Basic Information
- Name: (Re:)venants
- Symbol: RVNT
- Standard: ERC721
- Max Supply: 66 NFTs
- Requirements: Complete set of (re:)naissance tokens (10 different tokens, IDs 0-9)

### Key Features

#### Minting Mechanism
- Users must own at least one complete set of (re:)naissance tokens
- The number of NFTs a user can mint is equal to their minimum number of complete sets
- Contract owner can mint without requiring (re:)naissance tokens
- Built-in protection against reentrancy attacks

#### Functions
- `mint(uint256 quantity)`: Mint NFTs if you have enough complete sets
- `ownerMint(address to, uint256 quantity)`: Owner-only function to mint NFTs for any address
- `hasCompleteSet(address wallet)`: Check if an address owns a complete set
- `getMaxMintable(address wallet)`: Get the maximum number of NFTs an address can mint
- `totalSupply()`: Get the current total supply of minted NFTs
- `withdraw()`: Allow owner to withdraw accumulated ETH
- `setBaseURI(string)`: Update the base URI for token metadata

### Security Features
- Reentrancy protection
- Owner-only functions for administrative tasks
- Supply cap enforcement
- Proper balance checks

## Web Application

### Features
- Connect wallet button
- Automatic network detection and switching to Base Mainnet
- Real-time display of:
  - Wallet connection status
  - Number of complete sets owned
  - Maximum mintable NFTs
  - Current total supply
- Minting interface with quantity selection
- Error handling and user feedback

### Technical Stack
- Frontend: HTML, CSS, JavaScript
- Web3 Integration: ethers.js
- Network: Base Mainnet
- Smart Contract Interaction: Custom ABI integration

### Configuration
The application uses two main contracts:
1. (re:)naissance Contract (ERC1155)
   - Used to check token balances
   - Required for minting eligibility

2. (Re:)venants Contract (ERC721)
   - Handles the minting process
   - Manages NFT distribution

## Setup and Usage

1. Connect your wallet to Base Mainnet
2. Ensure you have a complete set of (re:)naissance tokens
3. Select the quantity of NFTs to mint (based on your eligible amount)
4. Confirm the transaction in your wallet

## Error Messages

The application handles various scenarios:
- Insufficient complete sets
- Network mismatch
- Wallet connection issues
- Maximum supply reached
- Invalid mint quantity
- Exceeds maximum mintable NFTs based on owned sets (if trying to mint more than allowed by complete sets owned)

## Metadata

NFT metadata is stored on IPFS with the following base URI:
```
ipfs://bafybeihxafmqc3bs7vv3o7wthvkgkcjw4jnna5laei5m4ienc2evxrpeoy/
```

Each token's metadata is accessed by appending the token ID and ".json" to the base URI.

## Development

The project uses:
- Solidity ^0.8.20
- OpenZeppelin contracts for security and standards
- ethers.js for Web3 integration
- Modern JavaScript for frontend functionality

## Security Considerations

- All sensitive functions are protected with appropriate modifiers
- Reentrancy protection implemented
- Owner-only functions for administrative tasks
- Proper error handling and input validation
- Secure token existence verification 