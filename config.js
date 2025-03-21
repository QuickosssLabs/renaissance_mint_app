// Application Configuration
const config = {
    // (re:)naissance contract address on Base Mainnet
    RENAISSANCE_CONTRACT: '0x516283C0138B1C12Dd4945e74AAEf65399A7b1D8',
    
    // Re:venants contract address (to be replaced after deployment)
    RVNT_MINT_CONTRACT: '0x_REVENANTS_CONTRACT',
    
    // (re:)naissance contract ABI (simplified for needed functions)
    RENAISSANCE_ABI: [
        'function balanceOf(address account, uint256 id) view returns (uint256)',
        'function balanceOfBatch(address[] accounts, uint256[] ids) view returns (uint256[])'
    ],
    
    // Re:venants contract ABI (simplified)
    RVNT_MINT_ABI: [
        'function mint(uint256 quantity)',
        'function totalSupply() view returns (uint256)',
        'function mintedPerWallet(address) view returns (uint256)',
        'function paused() view returns (bool)'
    ],
    
    // Maximum number of NFTs in Re:venants collection
    MAX_SUPPLY: 68,
    
    // (re:)naissance tokens configuration
    RENAISSANCE: {
        START_TOKEN_ID: 0,
        END_TOKEN_ID: 9,
        TOTAL_TOKENS: 10,
        COLLECTION_URL: 'https://opensea.io/collection/re-naissance-2',
        TOKEN_NAMES: [
            "(re:)comedian",
            "(re:)squiggle",
            "(re:)flection",
            "(re:)nger",
            "(re:)flower thrower",
            "star(re:)",
            "g(re:)at wav.",
            "(re:)david",
            "the sc(re:)am",
            "c(re:)ation"
        ]
    }
};
