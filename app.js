let provider;
let signer;
let renaissanceContract;
let revenantsMintContract;
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
const approveButton = document.getElementById('approveButton');
const mintStatus = document.getElementById('mintStatus');
const styledPopup = document.getElementById('styledPopup');
const popupTitle = document.getElementById('popupTitle');
const popupContent = document.getElementById('popupContent');
const closePopup = document.getElementById('closePopup');

// Function to display popup
function showPopup(title, content) {
    popupTitle.textContent = title;
    popupContent.innerHTML = content;
    styledPopup.classList.remove('hidden');
    styledPopup.classList.add('flex');
}

// Function to close popup
function hidePopup() {
    styledPopup.classList.remove('flex');
    styledPopup.classList.add('hidden');
}

// Event listener to close popup
closePopup.addEventListener('click', hidePopup);

// Check ethers availability
function checkEthers() {
    if (typeof ethers === 'undefined') {
        alert('Error: ethers.js is not loaded. Please refresh the page.');
        return false;
    }
    return true;
}

// Function to check contract pause status
async function checkPauseStatus() {
    try {
        const isPaused = await revenantsMintContract.paused();
        if (isPaused) {
            mintButton.disabled = true;
            mintButton.textContent = 'Mint Not Available Yet';
            showPopup('Mint Not Available', 'The mint is currently paused. Please check back later!');
        } else {
            mintButton.disabled = false;
            mintButton.textContent = 'Mint NFT';
        }
    } catch (error) {
        console.error('Error checking pause status:', error);
    }
}

// Connect wallet
async function connectWallet() {
    try {
        if (!checkEthers()) return;

        if (typeof window.ethereum !== 'undefined') {
            // Check and request network change to Base Mainnet if needed
            const chainId = await window.ethereum.request({ method: 'eth_chainId' });
            const baseMainnetChainId = '0x2105'; // Base Mainnet chainId
            
            if (chainId !== baseMainnetChainId) {
                try {
                    await window.ethereum.request({
                        method: 'wallet_switchEthereumChain',
                        params: [{ chainId: baseMainnetChainId }],
                    });
                } catch (switchError) {
                    // If network is not added, add it
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
            
            if (!config.RVNT_MINT_CONTRACT) {
                throw new Error('Re:venants contract address not configured');
            }
            
            revenantsMintContract = new ethers.Contract(
                config.RVNT_MINT_CONTRACT,
                config.RVNT_MINT_ABI,
                signer
            );
            
            // Update UI
            connectWalletBtn.textContent = 'Disconnect Wallet';
            connectWalletBtn.disabled = false;
            connectWalletBtn2.textContent = 'Disconnect Wallet';
            connectWalletBtn2.disabled = false;
            mintSection.classList.remove('hidden');
            notConnected.classList.add('hidden');
            
            // Remove existing event listeners and add disconnect event listeners
            connectWalletBtn.removeEventListener('click', connectWallet);
            connectWalletBtn2.removeEventListener('click', connectWallet);
            connectWalletBtn.addEventListener('click', disconnectWallet);
            connectWalletBtn2.addEventListener('click', disconnectWallet);
            
            // Check complete sets
            await checkCompleteSets();
            
            // Check pause status
            await checkPauseStatus();
            
            // Check if contract is approved
            const userAddress = await signer.getAddress();
            const isApproved = await renaissanceContract.isApprovedForAll(userAddress, config.RVNT_MINT_CONTRACT);
            
            // Update approve button state
            approveButton.disabled = isApproved;
            approveButton.textContent = isApproved ? 'Contract Approved' : 'Approve Contract';
            approveButton.classList.toggle('disabled', isApproved);
        } else {
            alert('Please open this website on MetaMask or Coinbase Wallet to use this application');
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
        
        // Check if contract exists
        const code = await provider.getCode(config.RENAISSANCE_CONTRACT);
        console.log('Contract code:', code);
        
        if (code === '0x') {
            throw new Error('Contract not found at the specified address');
        }
        
        // Check network
        const network = await provider.getNetwork();
        console.log('Current network:', network);
        
        // Check signer
        const signerAddress = await signer.getAddress();
        console.log('Signer address:', signerAddress);
        
        // Create array of all tokenIds (0 to 9)
        const tokenIds = Array.from(
            {length: config.RENAISSANCE.TOTAL_TOKENS}, 
            (_, i) => config.RENAISSANCE.START_TOKEN_ID + i
        );
        console.log('Token IDs to check:', tokenIds);
        
        // Create array of the same address repeated
        const addresses = Array(config.RENAISSANCE.TOTAL_TOKENS).fill(address);
        
        // Check balances in batch
        const balances = await renaissanceContract.balanceOfBatch(addresses, tokenIds);
        console.log('Balances:', balances.map(b => b.toString()));
        
        // Find minimum number of complete sets
        const minBalance = Math.min(...balances.map(b => b.toNumber()));
        maxMintable = minBalance;
        
        // Display balance summary
        const balanceSummary = balances.map((balance, index) => 
            `${config.RENAISSANCE.TOKEN_NAMES[index]}: ${balance.toString()}`
        ).join('\n');
        console.log('Balance Summary:\n', balanceSummary);
        
        if (maxMintable > 0) {
            completeSetCount.textContent = maxMintable;
            showPopup('Complete Sets Found!', `You have ${maxMintable} complete set(s)! You can mint ${maxMintable} Revenant(s).<br><br><strong>Important:</strong> Each Revenant mint will burn one complete set of Renaissance NFTs. This process cannot be reversed.`);
        } else {
            completeSetCount.textContent = '0';
            
            const missingTokens = balances
                .map((balance, index) => ({balance, index}))
                .filter(({balance}) => balance.eq(0))
                .map(({index}) => config.RENAISSANCE.TOKEN_NAMES[index]);
            
            if (missingTokens.length > 0) {
                console.log('Missing tokens:', missingTokens);
                
                // Create message with missing tokens and OpenSea link
                const message = `
                    <p style="margin-bottom: 15px;">You need to own at least one of each (re:)naissance NFT to mint. <strong>The mint button will remain disabled until you have a complete set.</strong></p>
                    
                    <p style="margin-bottom: 15px;"><strong>Important:</strong> Each Revenant mint will burn one complete set of Renaissance NFTs. This process cannot be reversed.</p>
                    
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
        await updateQuantityButtons();
        
        // Get number of already minted NFTs
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

// Function to get and display number of minted NFTs
async function updateMintedCount() {
    try {
        // Check if contract exists
        const code = await provider.getCode(config.RVNT_MINT_CONTRACT);
        console.log('RevenantsMint contract code:', code);
        
        if (code === '0x') {
            console.log('RevenantsMint contract not yet deployed at the specified address');
            mintedCount.textContent = 'Soon';
            
            // Update interface to indicate mint is not yet available
            mintButton.textContent = 'Coming Soon';
            mintButton.disabled = true;
            mintButton.classList.add('not-available');
            return;
        }
        
        try {
            // Get total number of minted NFTs
            console.log('Calling totalSupply on contract:', config.RVNT_MINT_CONTRACT);
            const totalMinted = await revenantsMintContract.totalSupply();
            console.log('Total minted:', totalMinted.toString());
            
            // Update user interface
            mintedCount.textContent = totalMinted.toString();
            
            // Check if collection is fully minted
            if (totalMinted.toString() === config.MAX_SUPPLY.toString()) {
                mintButton.textContent = 'Minted Out';
                mintButton.disabled = true;
                mintButton.classList.add('minted-out');
            }
        } catch (contractError) {
            console.error('Error calling totalSupply:', contractError);
            
            // Try alternative approach
            try {
                console.log('Trying to get _tokenIdCounter...');
                const tokenIdCounter = await revenantsMintContract._tokenIdCounter();
                console.log('Token ID Counter:', tokenIdCounter.toString());
                
                // Counter can be number of minted tokens or next ID
                // Depending on implementation, might need adjustment
                mintedCount.textContent = tokenIdCounter.toString();
                
                // Check if collection is fully minted
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
async function updateQuantityButtons() {
    decreaseQuantityBtn.disabled = currentQuantity <= 1;
    increaseQuantityBtn.disabled = currentQuantity >= maxMintable;
    
    try {
        // Check number of NFTs already minted by user
        const userAddress = await signer.getAddress();
        const mintedCount = await revenantsMintContract.mintedPerWallet(userAddress);
        
        // Disable mint button if user has no complete set or has reached maximum
        if (maxMintable === 0 || mintedCount >= maxMintable) {
            mintButton.disabled = true;
            mintButton.classList.add('disabled');
            mintButton.title = mintedCount >= maxMintable ? "You have reached your maximum mintable amount." : "You need a complete set to mint.";
        } else {
            mintButton.disabled = false;
            mintButton.classList.remove('disabled');
            mintButton.title = "";
        }
    } catch (error) {
        console.error('Error checking minted count:', error);
        // Keep existing logic in case of error
        if (maxMintable === 0) {
            mintButton.disabled = true;
            mintButton.classList.add('disabled');
            mintButton.title = "You need a complete set to mint.";
        } else {
            mintButton.disabled = false;
            mintButton.classList.remove('disabled');
            mintButton.title = "";
        }
    }
}

// Handle quantity
function decreaseQuantity() {
    if (currentQuantity > 1) {
        currentQuantity--;
        quantityDisplay.textContent = currentQuantity;
        updateQuantityButtons().catch(console.error);
    }
}

function increaseQuantity() {
    if (currentQuantity < maxMintable) {
        currentQuantity++;
        quantityDisplay.textContent = currentQuantity;
        updateQuantityButtons().catch(console.error);
    }
}

// Function to approve Re:venants contract as operator for Renaissance NFTs
async function approveRevenantsContract() {
    try {
        console.log('Starting approval process...');
        if (!checkEthers()) {
            console.log('Ethers check failed');
            return;
        }

        const userAddress = await signer.getAddress();
        console.log('User address:', userAddress);

        // Check if already approved
        const isApproved = await renaissanceContract.isApprovedForAll(userAddress, config.RVNT_MINT_CONTRACT);
        if (isApproved) {
            console.log('Contract already approved');
            showPopup('Already Approved', 'The Re:venants contract is already approved to burn your Renaissance NFTs.');
            return;
        }

        console.log('Requesting approval...');
        
        // Get the current gas price and estimate gas
        const gasPrice = await provider.getGasPrice();
        console.log('Current gas price:', gasPrice.toString());

        // Estimate gas for the transaction
        const gasEstimate = await renaissanceContract.estimateGas.setApprovalForAll(
            config.RVNT_MINT_CONTRACT,
            true,
            { from: userAddress }
        );
        console.log('Estimated gas:', gasEstimate.toString());

        // Add 20% buffer to gas estimate
        const gasLimit = gasEstimate.mul(120).div(100);
        console.log('Gas limit with buffer:', gasLimit.toString());

        // Prepare the transaction
        const tx = await renaissanceContract.setApprovalForAll(
            config.RVNT_MINT_CONTRACT,
            true,
            {
                gasLimit: gasLimit,
                gasPrice: gasPrice,
                nonce: await provider.getTransactionCount(userAddress)
            }
        );
        
        console.log('Approval transaction sent:', tx.hash);

        mintStatus.classList.remove('hidden');
        mintStatus.style.backgroundColor = '#82C4AE';
        mintStatus.style.color = '#115840';
        mintStatus.textContent = 'Approving contract...';

        // Wait for transaction confirmation with a longer timeout
        console.log('Waiting for transaction confirmation...');
        const receipt = await tx.wait(1); // Wait for 1 confirmation instead of 2
        console.log('Approval confirmed! Transaction receipt:', receipt);

        showPopup('Success!', 'Successfully approved the Re:venants contract to burn your Renaissance NFTs. You can now proceed with minting.');
        
        // Update approve button state
        approveButton.disabled = true;
        approveButton.textContent = 'Contract Approved';
        approveButton.classList.add('disabled');
    } catch (error) {
        console.error('Approval error:', error);
        console.error('Error details:', {
            message: error.message,
            code: error.code,
            data: error.data,
            transaction: error.transaction
        });
        
        let errorMessage = 'Error during approval: ';
        if (error.code === 'ACTION_REJECTED') {
            errorMessage += 'Transaction was rejected by user.';
        } else if (error.code === 'UNSUPPORTED_OPERATION') {
            errorMessage += 'Your wallet does not support this operation. Please try with a different wallet.';
        } else if (error.message.includes('ledger')) {
            errorMessage += 'Ledger error. Please make sure your Ledger is connected and unlocked, and try again.';
        } else if (error.message.includes('timeout')) {
            errorMessage += 'Transaction timed out. Please check your network connection and try again.';
        } else {
            errorMessage += error.message;
        }
        
        showPopup('Error', errorMessage);
    }
}

// Mint function
async function mint() {
    try {
        console.log('Starting mint process...');
        if (!checkEthers()) {
            console.log('Ethers check failed');
            return;
        }
        
        // Check if contract is deployed
        console.log('Checking contract deployment at:', config.RVNT_MINT_CONTRACT);
        const code = await provider.getCode(config.RVNT_MINT_CONTRACT);
        console.log('Contract code:', code);
        
        if (code === '0x') {
            console.log('Contract not deployed');
            showPopup('Not Available', 'The mint is not yet available. Please check back later.');
            return;
        }
        
        // Check if contract is approved
        const userAddress = await signer.getAddress();
        const isApproved = await renaissanceContract.isApprovedForAll(userAddress, config.RVNT_MINT_CONTRACT);
        if (!isApproved) {
            console.log('Contract not approved');
            showPopup('Approval Required', 'You need to approve the Re:venants contract to burn your Renaissance NFTs before minting. Click OK to proceed with approval.');
            await approveRevenantsContract();
            return;
        }
        
        // Vérifier si le wallet est blacklisté
        console.log('User address:', userAddress);
        
        if (config.BLACKLISTED_WALLETS.includes(userAddress.toLowerCase())) {
            console.log('Wallet blacklisted');
            showPopup('Blacklister wallet', 'This wallet has been blacklisted and cannot mint.');
            return;
        }
        
        // Check if collection is fully minted
        try {
            console.log('Checking total supply...');
            const totalMinted = await revenantsMintContract.totalSupply();
            console.log('Total minted:', totalMinted.toString());
            
            if (totalMinted.toString() === config.MAX_SUPPLY.toString()) {
                console.log('Collection fully minted');
                showPopup('Minted Out', 'Sorry, all NFTs have been minted!');
                
                // Update interface
                mintButton.textContent = 'Minted Out';
                mintButton.disabled = true;
                mintButton.classList.add('minted-out');
                return;
            }
        } catch (error) {
            console.error('Error checking total supply:', error);
            // Continue with mint even if we can't check total supply
        }
        
        if (maxMintable === 0) {
            console.log('No complete sets available');
            alert('You need a complete set to mint');
            return;
        }
        
        if (currentQuantity > maxMintable) {
            console.log('Quantity exceeds max mintable');
            alert(`You can only mint ${maxMintable} NFT(s) with your complete set(s)`);
            return;
        }
        
        console.log('Preparing mint transaction...');
        mintButton.disabled = true;
        mintButton.textContent = 'Minting...';
        
        // Mint without value (free)
        console.log('Calling mint function with quantity:', currentQuantity);
        const tx = await revenantsMintContract.mint(currentQuantity);
        console.log('Transaction sent:', tx.hash);
        
        mintStatus.classList.remove('hidden');
        mintStatus.style.backgroundColor = '#82C4AE';
        mintStatus.style.color = '#115840';
        mintStatus.textContent = 'Transaction in progress...';
        
        console.log('Waiting for transaction confirmation...');
        await tx.wait();
        console.log('Transaction confirmed!');
        
        showPopup('Success!', `Successfully minted ${currentQuantity} NFT(s)!`);
        
        // Reset
        currentQuantity = 1;
        quantityDisplay.textContent = currentQuantity;
        await updateQuantityButtons();
        
        // Update minted NFTs counter
        await updateMintedCount();
    } catch (error) {
        console.error('Mint error:', error);
        console.error('Error details:', {
            message: error.message,
            code: error.code,
            data: error.data,
            transaction: error.transaction
        });
        showPopup('Error', 'Error during mint: ' + error.message);
    } finally {
        mintButton.disabled = false;
        mintButton.textContent = 'Mint NFT';
    }
}

// Disconnect wallet
async function disconnectWallet() {
    try {
        // Reset provider and signer
        provider = null;
        signer = null;
        renaissanceContract = null;
        revenantsMintContract = null;
        
        // Update UI
        connectWalletBtn.textContent = 'Connect Wallet';
        connectWalletBtn.disabled = false;
        connectWalletBtn2.textContent = 'Connect Wallet';
        connectWalletBtn2.disabled = false;
        mintSection.classList.add('hidden');
        notConnected.classList.remove('hidden');
        
        // Remove disconnect event listeners and add connect event listeners
        connectWalletBtn.removeEventListener('click', disconnectWallet);
        connectWalletBtn2.removeEventListener('click', disconnectWallet);
        connectWalletBtn.addEventListener('click', connectWallet);
        connectWalletBtn2.addEventListener('click', connectWallet);
        
        console.log('Wallet disconnected');
    } catch (error) {
        console.error('Disconnection error:', error);
        alert('Error disconnecting wallet: ' + error.message);
    }
}

// Event Listeners
connectWalletBtn.addEventListener('click', connectWallet);
connectWalletBtn2.addEventListener('click', connectWallet);
decreaseQuantityBtn.addEventListener('click', decreaseQuantity);
increaseQuantityBtn.addEventListener('click', increaseQuantity);
mintButton.addEventListener('click', mint);
approveButton.addEventListener('click', approveRevenantsContract);

// Initialize maxSupply values
window.addEventListener('DOMContentLoaded', function() {
    if (maxSupply) maxSupply.textContent = config.MAX_SUPPLY;
    if (maxSupplyCount) maxSupplyCount.textContent = config.MAX_SUPPLY;
    
    // Reset event listeners on page load
    connectWalletBtn.removeEventListener('click', disconnectWallet);
    connectWalletBtn2.removeEventListener('click', disconnectWallet);
    connectWalletBtn.addEventListener('click', connectWallet);
    connectWalletBtn2.addEventListener('click', connectWallet);
}); 
