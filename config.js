// Configuration de l'application
const config = {
    // Adresse du contrat (re:)naissance sur Base Mainnet
    RENAISSANCE_CONTRACT: '0x516283C0138B1C12Dd4945e74AAEf65399A7b1D8',
    
    // ABI du contrat (re:)naissance (simplifié pour les fonctions dont nous avons besoin)
    RENAISSANCE_ABI: [
        'function balanceOf(address owner, uint256 id) view returns (uint256)',
        'function balanceOfBatch(address[] owners, uint256[] ids) view returns (uint256[])',
        'function totalSupply(uint256 tokenId) view returns (uint256)',
        'function maxSupply(uint256 tokenId) view returns (uint256)'
    ],
    
    // ABI du contrat Re:venants (simplifié)
    RVNT_MINT_ABI: [
        'function mint(uint256 quantity)',
        'function totalSupply() view returns (uint256)',
        'function _tokenIdCounter() view returns (uint256)',
        'function mintedPerWallet(address) view returns (uint256)'
    ],
    
    // Adresse du contrat Re:venants (à remplacer après déploiement)
    RVNT_MINT_CONTRACT: '0xA5DaF9D8e44E63dE2A0D9a894171111Ff80E0394',
    
    // Nombre maximum de NFTs dans la collection Re:venants
    MAX_SUPPLY: 66,
    
    // Configuration des tokens (re:)naissance
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

// Initialisation du prix de mint une fois qu'ethers est chargé
window.addEventListener('load', function() {
    if (typeof ethers !== 'undefined') {
        config.MINT_PRICE = ethers.utils.parseEther('0.00001');
    } else {
        console.error('ethers.js n\'est pas chargé');
    }
}); 