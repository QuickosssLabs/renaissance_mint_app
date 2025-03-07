let provider;
let signer;
let renaissanceContract;
let regenMintContract;
let currentQuantity = 1;
let maxMintable = 0;

// DOM Elements
const connectWalletBtn = document.getElementById('connectWallet');
const connectWalletBtn2 = document.getElementById('connectWallet2');
const mintSection = document.getElementById('mintSection');
const notConnected = document.getElementById('notConnected');
const completeSetCount = document.getElementById('completeSetCount');
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
    popupContent.textContent = content;
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
            
            if (!config.REGEN_MINT_CONTRACT) {
                throw new Error('RegenMint contract address not configured');
            }
            
            regenMintContract = new ethers.Contract(
                config.REGEN_MINT_CONTRACT,
                config.REGEN_MINT_ABI,
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
            `Token ${index}: ${balance.toString()}`
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
                .map(({index}) => index);
            
            if (missingTokens.length > 0) {
                console.log('Missing tokens:', missingTokens);
                showPopup(
                    'Incomplete Set',
                    `You need to own at least one of each (re:)naissance NFT (IDs 0-9) to mint.\nMissing tokens: ${missingTokens.join(', ')}`
                );
            }
        }
        
        // Update buttons
        updateQuantityButtons();
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
        
        mintButton.disabled = true;
        mintButton.textContent = 'Minting...';
        
        const tx = await regenMintContract.mint(currentQuantity, {
            value: config.MINT_PRICE.mul(currentQuantity)
        });
        
        mintStatus.classList.remove('hidden');
        mintStatus.classList.remove('bg-red-100', 'text-red-700', 'bg-green-100', 'text-green-700');
        mintStatus.classList.add('bg-blue-100', 'text-blue-700');
        mintStatus.textContent = 'Transaction in progress...';
        
        await tx.wait();
        
        showPopup('Success!', 'NFT(s) minted successfully!');
        
        // Reset
        currentQuantity = 1;
        quantityDisplay.textContent = currentQuantity;
        updateQuantityButtons();
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