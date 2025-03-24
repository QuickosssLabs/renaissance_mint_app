let provider;
let renaissanceContract;
let revenantsContract;
let totalTransfers = 0;
let todayTransfers = 0;
let lastTransferTime = null;

// Structure to track recent transfers by wallet
let recentTransfers = new Map();

// DOM Elements
const connectWalletBtn = document.getElementById('connectWallet');
const transferList = document.getElementById('transferList');
const totalTransfersElement = document.getElementById('totalTransfers');
const todayTransfersElement = document.getElementById('todayTransfers');
const lastTransferElement = document.getElementById('lastTransfer');

// Function to check if an address has minted a Revenant
async function checkRevenantHolder(address) {
    try {
        if (!revenantsContract) {
            revenantsContract = new ethers.Contract(
                config.RVNT_MINT_CONTRACT,
                config.RVNT_MINT_ABI,
                provider
            );
        }
        
        const balance = await revenantsContract.balanceOf(address);
        if (balance > 0) {
            // Get the mint timestamp by looking at the Transfer event
            const filter = revenantsContract.filters.Transfer(null, address);
            const events = await revenantsContract.queryFilter(filter);
            if (events.length > 0) {
                const block = await events[0].getBlock();
                return {
                    hasRevenant: true,
                    mintTimestamp: block.timestamp
                };
            }
        }
        return {
            hasRevenant: false,
            mintTimestamp: null
        };
    } catch (error) {
        console.error('Error checking Revenant balance:', error);
        return {
            hasRevenant: false,
            mintTimestamp: null
        };
    }
}

// Function to check if a complete set has been transferred quickly
async function checkQuickSetTransfer(from, to, timestamp, tokenId) {
    // Si le wallet source n'est pas dans notre Map, on l'initialise
    if (!recentTransfers.has(from)) {
        recentTransfers.set(from, {
            transfers: new Map(), // Map pour stocker les transferts vers différents destinataires
            lastTransferTime: timestamp
        });
    }

    const walletData = recentTransfers.get(from);
    const transferKey = `${from}-${to}`; // Clé unique pour la paire source-destination
    
    // Si cette paire source-destination n'existe pas, on l'initialise
    if (!walletData.transfers.has(transferKey)) {
        walletData.transfers.set(transferKey, {
            tokens: new Set(),
            startTime: timestamp
        });
    }

    const transferData = walletData.transfers.get(transferKey);
    
    // Vérifie si le transfert est dans les 10 dernières minutes
    if (timestamp - transferData.startTime > 600) { // 600 secondes = 10 minutes
        // Réinitialise les données si plus de 10 minutes
        transferData.tokens.clear();
        transferData.startTime = timestamp;
    }

    // Ajoute le token au set
    transferData.tokens.add(tokenId);

    // Vérifie si nous avons un set complet
    if (transferData.tokens.size === 10) {
        const timeDiff = timestamp - transferData.startTime;
        if (timeDiff <= 600) { // Si dans les 10 minutes
            // Vérifie si l'adresse "from" a un Revenant
            const revenantInfo = await checkRevenantHolder(from);
            
            // N'affiche l'alerte que si l'adresse source possède un Revenant
            if (revenantInfo.hasRevenant) {
                const timeInMinutes = (timeDiff / 60).toFixed(2);
                const transferTime = formatDate(timestamp);
                const mintTime = formatDate(revenantInfo.mintTimestamp);
                const shortAddress = from.slice(0, 6) + '...' + from.slice(-4);
                
                showPopup(
                    'Complete Set Detected!',
                    `A complete Renaissance set has been transferred in ${timeInMinutes} minutes!<br><br>
                    Time: ${transferTime}<br>
                    From: ${from}<br>
                    To: ${to}<br>
                    <span style="color: #ff4444;">⚠️ Address ${shortAddress} owns a Revenant!<br>Minted on: ${mintTime}</span><br><br>
                    Tokens: ${Array.from(transferData.tokens).map(id => config.RENAISSANCE.TOKEN_NAMES[id]).join(', ')}`,
                    to
                );
            }
            
            // Réinitialise les données pour cette paire source-destination
            walletData.transfers.delete(transferKey);
        }
    }

    // Nettoie les anciennes données
    if (timestamp - walletData.lastTransferTime > 600) {
        recentTransfers.delete(from);
    }
}

// Function to format address
function formatAddress(address) {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

// Function to format date
function formatDate(timestamp) {
    const date = new Date(timestamp * 1000);
    return date.toLocaleString('en-US', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
}

// Function to display popup
function showPopup(title, content, fromAddress) {
    const popup = document.createElement('div');
    popup.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background-color: #115840;
        color: white;
        padding: 20px;
        border: 3px solid #83c4ae;
        z-index: 1000;
        max-width: 80%;
        text-align: center;
    `;
    
    popup.innerHTML = `
        <h3 style="margin-bottom: 15px; color: #83c4ae;">${title}</h3>
        <div style="font-size: 12px;">${content}</div>
        <div style="margin-top: 15px; display: flex; gap: 10px; justify-content: center;">
            <button onclick="this.parentElement.parentElement.remove()" style="
                background-color: #83c4ae;
                color: #115840;
                border: none;
                padding: 8px 15px;
                cursor: pointer;
                font-family: 'Press Start 2P', sans-serif;
                font-size: 10px;
            ">Close</button>
            <button onclick="copyToClipboard('${fromAddress}')" style="
                background-color: #83c4ae;
                color: #115840;
                border: none;
                padding: 8px 15px;
                cursor: pointer;
                font-family: 'Press Start 2P', sans-serif;
                font-size: 10px;
            ">Copy Address</button>
            <button onclick="addToBlacklist('${fromAddress}')" style="
                background-color: #ff4444;
                color: white;
                border: none;
                padding: 8px 15px;
                cursor: pointer;
                font-family: 'Press Start 2P', sans-serif;
                font-size: 10px;
            ">Blacklist</button>
        </div>
    `;
    
    document.body.appendChild(popup);
}

// Function to copy address to clipboard
function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        alert('Address copied to clipboard!');
    }).catch(err => {
        console.error('Error copying:', err);
        alert('Error copying address');
    });
}

// Function to add address to blacklist
function addToBlacklist(address) {
    if (!config.BLACKLISTED_WALLETS.includes(address.toLowerCase())) {
        config.BLACKLISTED_WALLETS.push(address.toLowerCase());
        alert('Address added to blacklist!');
    } else {
        alert('This address is already blacklisted!');
    }
}

// Function to add transfer to list
function addTransferToList(transfer) {
    const transferItem = document.createElement('div');
    transferItem.className = 'transfer-item';
    
    const timestamp = formatDate(transfer.timestamp);
    const tokenName = config.RENAISSANCE.TOKEN_NAMES[transfer.tokenId];
    const from = formatAddress(transfer.from);
    const to = formatAddress(transfer.to);
    
    transferItem.innerHTML = `
        <div class="timestamp">${timestamp}</div>
        <div class="token-name">${tokenName}</div>
        <div class="addresses">
            From: ${from}<br>
            To: ${to}
        </div>
    `;
    
    transferList.insertBefore(transferItem, transferList.firstChild);
    
    // Update statistics
    totalTransfers++;
    totalTransfersElement.textContent = totalTransfers;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const transferDate = new Date(transfer.timestamp * 1000);
    
    if (transferDate >= today) {
        todayTransfers++;
        todayTransfersElement.textContent = todayTransfers;
    }
    
    lastTransferTime = transfer.timestamp;
    lastTransferElement.textContent = formatDate(lastTransferTime);

    // Check if it's a quick complete set transfer
    checkQuickSetTransfer(transfer.from, transfer.to, transfer.timestamp, transfer.tokenId);
}

// Function to fetch historical transfers
async function fetchHistoricalTransfers() {
    try {
        console.log('Fetching historical transfers...');
        
        // Calculate blocks for last 12 hours (assuming 12 seconds per block)
        const blocksPer12Hours = Math.floor(12 * 60 * 60 / 12); // ~3600 blocks per 12 hours
        const currentBlock = await provider.getBlockNumber();
        const fromBlock = Math.max(0, currentBlock - blocksPer12Hours);
        
        console.log(`Fetching transfers from the last 12 hours`);
        console.log(`From block ${fromBlock} to ${currentBlock}`);
        console.log('Contract address:', config.RENAISSANCE_CONTRACT);
        
        // Fetch events in smaller chunks (500 blocks each)
        const chunkSize = 500;
        let totalEvents = 0;
        
        for (let startBlock = fromBlock; startBlock <= currentBlock; startBlock += chunkSize) {
            const endBlock = Math.min(startBlock + chunkSize - 1, currentBlock);
            console.log(`Fetching blocks ${startBlock} to ${endBlock}`);
            
            try {
                // Get all events for this chunk
                const events = await renaissanceContract.queryFilter('*', startBlock, endBlock);
                console.log(`Found ${events.length} total events in this chunk`);
                
                // Log all event names to see what events are available
                if (events.length > 0) {
                    console.log('Event names found:', events.map(e => e.event));
                }
                
                // Process each event
                for (const event of events) {
                    try {
                        console.log('Processing event:', event.event, event.args);
                        
                        // Only process TransferSingle and TransferBatch events
                        if (event.event === 'TransferSingle' || event.event === 'TransferBatch') {
                            const block = await event.getBlock();
                            
                            if (event.event === 'TransferSingle') {
                                const transfer = {
                                    tokenId: event.args.id.toNumber(),
                                    from: event.args.from,
                                    to: event.args.to,
                                    timestamp: block.timestamp
                                };
                                console.log('Processing single transfer:', transfer);
                                addTransferToList(transfer);
                                totalEvents++;
                            } else if (event.event === 'TransferBatch') {
                                const ids = event.args.ids;
                                for (let i = 0; i < ids.length; i++) {
                                    const transfer = {
                                        tokenId: ids[i].toNumber(),
                                        from: event.args.from,
                                        to: event.args.to,
                                        timestamp: block.timestamp
                                    };
                                    console.log('Processing batch transfer:', transfer);
                                    addTransferToList(transfer);
                                    totalEvents++;
                                }
                            }
                        }
                        
                        await new Promise(resolve => setTimeout(resolve, 50));
                    } catch (eventError) {
                        console.error('Error processing event:', eventError);
                        continue;
                    }
                }
                
                await new Promise(resolve => setTimeout(resolve, 200));
                
            } catch (chunkError) {
                console.error(`Error fetching chunk ${startBlock}-${endBlock}:`, chunkError);
                continue;
            }
        }
        
        console.log(`Total events processed: ${totalEvents}`);
        
    } catch (error) {
        console.error('Error fetching historical transfers:', error);
        alert('Error fetching historical transfers. Please check the console for details.');
    }
}

// Function to listen to new transfers
function listenToNewTransfers() {
    console.log('Setting up transfer listener...');
    
    // Listen for all events and filter them
    renaissanceContract.on('*', async (event) => {
        console.log('New event detected:', event.event, event.args);
        
        if (event.event === 'TransferSingle' || event.event === 'TransferBatch') {
            console.log(`Processing new ${event.event}:`, event.args);
            try {
                const block = await event.getBlock();
                
                if (event.event === 'TransferSingle') {
                    const transfer = {
                        tokenId: event.args.id.toNumber(),
                        from: event.args.from,
                        to: event.args.to,
                        timestamp: block.timestamp
                    };
                    addTransferToList(transfer);
                } else if (event.event === 'TransferBatch') {
                    const ids = event.args.ids;
                    for (let i = 0; i < ids.length; i++) {
                        const transfer = {
                            tokenId: ids[i].toNumber(),
                            from: event.args.from,
                            to: event.args.to,
                            timestamp: block.timestamp
                        };
                        addTransferToList(transfer);
                    }
                }
            } catch (error) {
                console.error(`Error processing new ${event.event}:`, error);
            }
        }
    });
}

// Wallet connection function
async function connectWallet() {
    try {
        if (typeof window.ethereum !== 'undefined') {
            // Check and request network switch to Base Mainnet if needed
            const chainId = await window.ethereum.request({ method: 'eth_chainId' });
            const baseMainnetChainId = '0x2105';
            
            if (chainId !== baseMainnetChainId) {
                try {
                    await window.ethereum.request({
                        method: 'wallet_switchEthereumChain',
                        params: [{ chainId: baseMainnetChainId }],
                    });
                } catch (switchError) {
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
            
            // Initialize provider
            provider = new ethers.providers.Web3Provider(window.ethereum);
            
            // Initialize Renaissance contract
            renaissanceContract = new ethers.Contract(
                config.RENAISSANCE_CONTRACT,
                config.RENAISSANCE_ABI,
                provider
            );
            
            // Update UI
            connectWalletBtn.textContent = 'Disconnect';
            connectWalletBtn.disabled = false;
            
            // Fetch historical transfers
            await fetchHistoricalTransfers();
            
            // Listen to new transfers
            listenToNewTransfers();
            
            console.log('Wallet connected and listeners set up');
        } else {
            alert('Please open this site in MetaMask or Coinbase Wallet');
        }
    } catch (error) {
        console.error('Connection error:', error);
        alert('Connection error: ' + error.message);
    }
}

// Wallet disconnection function
async function disconnectWallet() {
    try {
        // Reset provider and contract
        provider = null;
        renaissanceContract = null;
        
        // Update UI
        connectWalletBtn.textContent = 'Connect Wallet';
        connectWalletBtn.disabled = false;
        
        // Reset counters
        totalTransfers = 0;
        todayTransfers = 0;
        totalTransfersElement.textContent = '0';
        todayTransfersElement.textContent = '0';
        lastTransferElement.textContent = '-';
        
        // Clear transfer list
        transferList.innerHTML = '';
    } catch (error) {
        console.error('Disconnection error:', error);
        alert('Disconnection error: ' + error.message);
    }
}

// Event Listeners
connectWalletBtn.addEventListener('click', () => {
    if (provider) {
        disconnectWallet();
    } else {
        connectWallet();
    }
});

// Initialization
window.addEventListener('DOMContentLoaded', () => {
    connectWalletBtn.removeEventListener('click', disconnectWallet);
    connectWalletBtn.addEventListener('click', connectWallet);
}); 