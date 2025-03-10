let provider;
let signer;
let renaissanceContract;
let reveMintContract;
let currentQuantity = 1;
let maxMintable = 0;

// DOM Elements
const connectWalletBtn = document.getElementById('connectWallet');
const connectWalletBtn2 = document.getElementById('connectWallet2');
const mintSection = document.getElementById('mintSection');
const notConnected = document.getElementById('notConnected');
const completeSetCount = document.getElementById('completeSetCount');
const mintedCount = document.getElementById('mintedCount');
const maxSupply = document.getElementById('maxSupply');
const maxSupplyCount = document.getElementById('maxSupplyCount');
const quantityDisplay = document.getElementById('quantity');
const decreaseQuantityBtn = document.getElementById('decreaseQuantity');
const increaseQuantityBtn = document.getElementById('increaseQuantity');
const mintButton = document.getElementById('mintButton');
const mintStatus = document.getElementById('mintStatus');
const styledPopup = document.getElementById('styledPopup');
const popupTitle = document.getElementById('popupTitle');
const popupContent = document.getElementById('popupContent');
const closePopup = document.getElementById('closePopup');

// Fonction pour afficher le popup
function showPopup(title, content) {
    popupTitle.textContent = title;
    popupContent.innerHTML = content;
    styledPopup.classList.remove('hidden');
    styledPopup.classList.add('flex');
}

// Fonction pour fermer le popup
function hidePopup() {
    styledPopup.classList.remove('flex');
    styledPopup.classList.add('hidden');
}

// Event listener pour fermer le popup
closePopup.addEventListener('click', hidePopup);

// Check ethers availability
function checkEthers() {
    if (typeof ethers === 'undefined') {
        alert('Error: ethers.js is not loaded. Please refresh the page.');
        return false;
    }
    return true;
}

// Connect wallet
async function connectWallet() {
    try {
        if (!checkEthers()) return;

        if (typeof window.ethereum !== 'undefined') {
            // Vérifier et demander le changement de réseau vers Base Mainnet si nécessaire
            const chainId = await window.ethereum.request({ method: 'eth_chainId' });
            const baseMainnetChainId = '0x2105'; // Base Mainnet chainId
            
            if (chainId !== baseMainnetChainId) {
                try {
                    await window.ethereum.request({
                        method: 'wallet_switchEthereumChain',
                        params: [{ chainId: baseMainnetChainId }],
                    });
                } catch (switchError) {
                    // Si le réseau n'est pas ajouté, on l'ajoute
                    if (switchError.code === 4902) {
                        await window.ethereum.request({
                            method: 'wallet_addEthereumChain',
                            params: [{
                                chainId: baseMainnetChainId,
                                chainName: 'Base Mainnet',
                                nativeCurrency: {
                                    name: 'ETH',
                                    symbol: 'ETH',
                                    decimals: 18
                                },
                                rpcUrls: ['https://mainnet.base.org'],
                                blockExplorerUrls: ['https://basescan.org']
                            }]
                        });
                    } else {
                        throw switchError;
                    }
                }
            }
            
            // Request wallet connection
            await window.ethereum.request({ method: 'eth_requestAccounts' });
            
            // Initialize provider
            provider = new ethers.providers.Web3Provider(window.ethereum);
            signer = provider.getSigner();
            
            // Initialize contracts
            renaissanceContract = new ethers.Contract(
                config.RENAISSANCE_CONTRACT,
                config.RENAISSANCE_ABI,
                signer
            );
            
            if (!config.REVE_MINT_CONTRACT) {
                throw new Error('Re:venants contract address not configured');
            }
            
            reveMintContract = new ethers.Contract(
                config.REVE_MINT_CONTRACT,
                config.REVE_MINT_ABI,
                signer
            );
            
            // Update UI
            connectWalletBtn.textContent = 'Wallet Connected';
            connectWalletBtn.disabled = true;
            connectWalletBtn2.textContent = 'Wallet Connected';
            connectWalletBtn2.disabled = true;
            mintSection.classList.remove('hidden');
            notConnected.classList.add('hidden');
            
            // Check complete sets
            await checkCompleteSets();
        } else {
            alert('Please install MetaMask to use this application');
        }
    } catch (error) {
        console.error('Connection error:', error);
        let errorMessage = 'Error connecting to wallet: ';
        
        if (error.code === 4001) {
            errorMessage += 'Please connect your wallet and switch to Base Mainnet';
        } else if (error.code === -32002) {
            errorMessage += 'A request is already pending. Please check your wallet';
        } else {
            errorMessage += error.message;
        }
        
        alert(errorMessage);
    }
}

// Check complete sets
async function checkCompleteSets() {
    try {
        const address = await signer.getAddress();
        console.log('Checking complete sets for address:', address);
        console.log('Using contract address:', config.RENAISSANCE_CONTRACT);
        
        // Vérifier que le contrat existe
        const code = await provider.getCode(config.RENAISSANCE_CONTRACT);
        console.log('Contract code:', code);
        
        if (code === '0x') {
            throw new Error('Contract not found at the specified address');
        }
        
        // Vérifier le réseau
        const network = await provider.getNetwork();
        console.log('Current network:', network);
        
        // Vérifier le signer
        const signerAddress = await signer.getAddress();
        console.log('Signer address:', signerAddress);
        
        // Créer un tableau de tous les tokenIds (de 0 à 9)
        const tokenIds = Array.from(
            {length: config.RENAISSANCE.TOTAL_TOKENS}, 
            (_, i) => config.RENAISSANCE.START_TOKEN_ID + i
        );
        console.log('Token IDs to check:', tokenIds);
        
        // Créer un tableau de la même adresse répétée
        const addresses = Array(config.RENAISSANCE.TOTAL_TOKENS).fill(address);
        
        // Vérifier les balances en batch
        const balances = await renaissanceContract.balanceOfBatch(addresses, tokenIds);
        console.log('Balances:', balances.map(b => b.toString()));
        
        // Vérifier si l'utilisateur a au moins un de chaque token
        const hasCompleteSet = balances.every(balance => balance.gt(0));
        
        // Afficher un résumé des balances
        const balanceSummary = balances.map((balance, index) => 
            `${config.RENAISSANCE.TOKEN_NAMES[index]}: ${balance.toString()}`
        ).join('\n');
        console.log('Balance Summary:\n', balanceSummary);
        
        if (hasCompleteSet) {
            maxMintable = 1;
            completeSetCount.textContent = maxMintable;
            showPopup('Complete Set Found!', 'You have a complete set! You can mint 1 NFT.');
        } else {
            maxMintable = 0;
            completeSetCount.textContent = '0';
            
            const missingTokens = balances
                .map((balance, index) => ({balance, index}))
                .filter(({balance}) => balance.eq(0))
                .map(({index}) => config.RENAISSANCE.TOKEN_NAMES[index]);
            
            if (missingTokens.length > 0) {
                console.log('Missing tokens:', missingTokens);
                
                // Créer le message avec les noms des tokens manquants et le lien vers OpenSea
                const message = `
                    <p style="margin-bottom: 15px;">You need to own at least one of each (re:)naissance NFT to mint.</p>
                    
                    <p style="margin-bottom: 15px;"><strong>Missing tokens:</strong><br>
                    ${missingTokens.map(token => `• ${token}`).join('<br>')}
                    </p>
                    
                    <p style="margin-top: 20px;">
                        <strong>Get your missing NFTs at:</strong><br>
                        <a href="${config.RENAISSANCE.COLLECTION_URL}" target="_blank" style="color: #115840; text-decoration: underline; display: inline-block; margin-top: 8px;">${config.RENAISSANCE.COLLECTION_URL}</a>
                    </p>
                `;
                
                showPopup('Incomplete Set', message);
            }
        }
        
        // Update buttons
        updateQuantityButtons();
        
        // Récupérer le nombre de NFTs déjà mintés
        await updateMintedCount();
    } catch (error) {
        console.error('Error checking sets:', error);
        let errorMessage = 'Error checking complete sets: ';
        
        if (error.code === 'CALL_EXCEPTION') {
            errorMessage += 'The contract call failed. Please verify:';
            errorMessage += '\n1. You are connected to the Base network';
            errorMessage += '\n2. The contract address is correct';
            errorMessage += '\n3. The function exists in the contract';
            errorMessage += '\n\nContract address: ' + config.RENAISSANCE_CONTRACT;
            errorMessage += '\nNetwork: Base Mainnet';
        } else {
            errorMessage += error.message;
        }
        
        alert(errorMessage);
    }
}

// Fonction pour récupérer et afficher le nombre de NFTs déjà mintés
async function updateMintedCount() {
    try {
        // Vérifier que le contrat existe
        const code = await provider.getCode(config.REVE_MINT_CONTRACT);
        console.log('RevenantsMint contract code:', code);
        
        if (code === '0x') {
            console.log('RevenantsMint contract not yet deployed at the specified address');
            mintedCount.textContent = 'Soon';
            
            // Mettre à jour l'interface pour indiquer que le mint n'est pas encore disponible
            mintButton.textContent = 'Coming Soon';
            mintButton.disabled = true;
            mintButton.classList.add('not-available');
            return;
        }
        
        try {
            // Récupérer le nombre total de NFTs mintés
            console.log('Calling totalSupply on contract:', config.REVE_MINT_CONTRACT);
            const totalMinted = await reveMintContract.totalSupply();
            console.log('Total minted:', totalMinted.toString());
            
            // Mettre à jour l'interface utilisateur
            mintedCount.textContent = totalMinted.toString();
            
            // Vérifier si la collection est complètement mintée
            if (totalMinted.toString() === config.MAX_SUPPLY.toString()) {
                mintButton.textContent = 'Minted Out';
                mintButton.disabled = true;
                mintButton.classList.add('minted-out');
            }
        } catch (contractError) {
            console.error('Error calling totalSupply:', contractError);
            
            // Essayer une approche alternative
            try {
                console.log('Trying to get _tokenIdCounter...');
                const tokenIdCounter = await reveMintContract._tokenIdCounter();
                console.log('Token ID Counter:', tokenIdCounter.toString());
                
                // Le compteur peut être le nombre de tokens mintés ou le prochain ID
                // Selon l'implémentation, on pourrait devoir ajuster
                mintedCount.textContent = tokenIdCounter.toString();
                
                // Vérifier si la collection est complètement mintée
                if (tokenIdCounter.toString() === config.MAX_SUPPLY.toString()) {
                    mintButton.textContent = 'Minted Out';
                    mintButton.disabled = true;
                    mintButton.classList.add('minted-out');
                }
            } catch (alternativeError) {
                console.error('Alternative approach failed:', alternativeError);
                mintedCount.textContent = '?';
                
                console.log('Contract might not have the expected functions to get minted count');
            }
        }
    } catch (error) {
        console.error('Error getting minted count:', error);
        mintedCount.textContent = '--';
    }
}

// Update quantity buttons
function updateQuantityButtons() {
    decreaseQuantityBtn.disabled = currentQuantity <= 1;
    increaseQuantityBtn.disabled = currentQuantity >= maxMintable;
}

// Handle quantity
function decreaseQuantity() {
    if (currentQuantity > 1) {
        currentQuantity--;
        quantityDisplay.textContent = currentQuantity;
        updateQuantityButtons();
    }
}

function increaseQuantity() {
    if (currentQuantity < maxMintable) {
        currentQuantity++;
        quantityDisplay.textContent = currentQuantity;
        updateQuantityButtons();
    }
}

// Mint function
async function mint() {
    try {
        if (!checkEthers()) return;
        
        // Vérifier que le contrat est déployé
        const code = await provider.getCode(config.REVE_MINT_CONTRACT);
        if (code === '0x') {
            showPopup('Not Available', 'The mint is not yet available. Please check back later.');
            return;
        }
        
        // Vérifier si la collection est complètement mintée
        try {
            const totalMinted = await reveMintContract.totalSupply();
            if (totalMinted.toString() === config.MAX_SUPPLY.toString()) {
                showPopup('Minted Out', 'Sorry, all NFTs have been minted!');
                
                // Mettre à jour l'interface
                mintButton.textContent = 'Minted Out';
                mintButton.disabled = true;
                mintButton.classList.add('minted-out');
                return;
            }
        } catch (error) {
            console.error('Error checking total supply:', error);
            // Continuer avec le mint même si on ne peut pas vérifier le total supply
        }
        
        mintButton.disabled = true;
        mintButton.textContent = 'Minting...';
        
        const tx = await reveMintContract.mint(currentQuantity, {
            value: config.MINT_PRICE.mul(currentQuantity)
        });
        
        mintStatus.classList.remove('hidden');
        mintStatus.style.backgroundColor = '#82C4AE';
        mintStatus.style.color = '#115840';
        mintStatus.textContent = 'Transaction in progress...';
        
        await tx.wait();
        
        showPopup('Success!', 'NFT(s) minted successfully!');
        
        // Reset
        currentQuantity = 1;
        quantityDisplay.textContent = currentQuantity;
        updateQuantityButtons();
        
        // Mettre à jour le compteur de NFTs mintés
        await updateMintedCount();
    } catch (error) {
        console.error('Mint error:', error);
        showPopup('Error', 'Error during mint: ' + error.message);
    } finally {
        mintButton.disabled = false;
        mintButton.textContent = 'Mint NFT';
    }
}

// Event Listeners
connectWalletBtn.addEventListener('click', connectWallet);
connectWalletBtn2.addEventListener('click', connectWallet);
decreaseQuantityBtn.addEventListener('click', decreaseQuantity);
increaseQuantityBtn.addEventListener('click', increaseQuantity);
mintButton.addEventListener('click', mint);

// Initialiser les valeurs de maxSupply
window.addEventListener('DOMContentLoaded', function() {
    if (maxSupply) maxSupply.textContent = config.MAX_SUPPLY;
    if (maxSupplyCount) maxSupplyCount.textContent = config.MAX_SUPPLY;
}); 