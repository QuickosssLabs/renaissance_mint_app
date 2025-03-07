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
    
    // ABI du contrat RegenMint (simplifié)
    REGEN_MINT_ABI: [
        'function mint(uint256 quantity) payable'
    ],
    
    // Prix de mint en ETH (sera calculé après le chargement d'ethers)
    MINT_PRICE: null,
    
    // Adresse du contrat RegenMint (à remplacer après déploiement)
    REGEN_MINT_CONTRACT: '0xA5DaF9D8e44E63dE2A0D9a894171111Ff80E0394',
    
    // Configuration des tokens (re:)naissance
    RENAISSANCE: {
        START_TOKEN_ID: 0,
        END_TOKEN_ID: 9,
        TOTAL_TOKENS: 10
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