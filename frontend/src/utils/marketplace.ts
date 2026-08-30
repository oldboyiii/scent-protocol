import { ethers } from "ethers";

// Deployed Marketplace Contract Address on Arc Testnet
export const MARKETPLACE_ADDRESS = "0x23d2F6655F23D245348ce6Db11e07eab823E6D66";

// Native USDC Address on Arc Network
export const USDC_ADDRESS = "0x3600000000000000000000000000000000000000";

const MARKETPLACE_ABI = [
  "function listings(uint256) view returns (address seller, uint256 price, bool active)",
  "function activeTokenIds(uint256) view returns (uint256)",
  "function getActiveCount() view returns (uint256)",
  "function list(uint256 tokenId, uint256 price)",
  "function buy(uint256 tokenId)",
  "function cancel(uint256 tokenId)",
  "event Listed(uint256 indexed tokenId, address indexed seller, uint256 price)",
  "event Sold(uint256 indexed tokenId, address indexed seller, address indexed buyer, uint256 price)",
  "event Cancelled(uint256 indexed tokenId, address indexed seller)"
];

const ERC20_ABI = [
  "function allowance(address owner, address spender) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function balanceOf(address account) view returns (uint256)"
];

const NFT_ABI_FOR_APPROVE = [
  "function approve(address to, uint256 tokenId)",
  "function getApproved(uint256 tokenId) view returns (address)"
];

/**
 * Creates a provider specifically for Arc Network with ENS disabled.
 * This prevents "network does not support ENS" errors in ethers v6.
 */
export const getArcProvider = (): ethers.BrowserProvider => {
  const win = window as any;
  if (!win.ethereum) throw new Error("No Ethereum provider found");
  
  const provider = new ethers.BrowserProvider(win.ethereum);
  
  // Explicitly disable ENS resolution for Arc testnet/mainnet
  // ChainId for Arc Testnet is usually 5042002 or similar
  provider.getNetwork().then((network) => {
    if (network && network.chainId !== 1n && network.chainId !== 11155111n) {
      Object.defineProperty(network, 'ensAddress', {
        value: null,
        writable: false,
        configurable: true
      });
    }
  }).catch(() => {}); // Ignore errors during init
  
  return provider;
};

/**
 * Returns a contract instance for the Marketplace
 */
export const getMarketplaceContract = (signerOrProvider: ethers.Signer | ethers.Provider) => {
  return new ethers.Contract(MARKETPLACE_ADDRESS, MARKETPLACE_ABI, signerOrProvider);
};

/**
 * Returns a contract instance for USDC
 */
export const getUsdcContract = (signerOrProvider: ethers.Signer | ethers.Provider) => {
  return new ethers.Contract(USDC_ADDRESS, ERC20_ABI, signerOrProvider);
};

/**
 * Fetches all active listings from the marketplace contract
 */
export const fetchActiveListings = async (provider: ethers.Provider) => {
  try {
    const contract = getMarketplaceContract(provider);
    const count = await contract.getActiveCount();
    const listings = [];

    // Loop through all active token IDs
    for (let i = 0; i < Number(count); i++) {
      const tokenId = await contract.activeTokenIds(i);
      const listingData = await contract.listings(tokenId);
      
      if (listingData.active) {
        listings.push({
          tokenId: Number(tokenId),
          seller: listingData.seller,
          price: listingData.price,
          active: listingData.active
        });
      }
    }
    return listings;
  } catch (error) {
    console.error("Error fetching active listings:", error);
    return [];
  }
};

/**
 * Checks if a specific token is currently listed for sale
 */
export const checkIfListed = async (provider: ethers.Provider, tokenId: number) => {
  try {
    const contract = getMarketplaceContract(provider);
    const listing = await contract.listings(tokenId);
    return {
      active: listing.active,
      seller: listing.seller,
      price: listing.price
    };
  } catch (error) {
    console.error(`Error checking listing for token ${tokenId}:`, error);
    return { active: false, seller: ethers.ZeroAddress, price: 0n };
  }
};

/**
 * Lists an NFT for sale. Handles NFT approval automatically and safely.
 */
export const listNFT = async (
  signer: ethers.Signer, 
  nftContractAddress: string, 
  tokenId: number, 
  priceInUsdc: string
) => {
  const nftContract = new ethers.Contract(nftContractAddress, NFT_ABI_FOR_APPROVE, signer);
  const marketplace = getMarketplaceContract(signer);

  try {
    // 1. Check current approval status without triggering ENS
    let currentApproval = ethers.ZeroAddress;
    try {
      currentApproval = await nftContract.getApproved(tokenId);
    } catch (e) {
      console.warn("Could not check approval, forcing approve...", e);
    }

    // 2. Approve only if necessary
    if (currentApproval.toLowerCase() !== MARKETPLACE_ADDRESS.toLowerCase()) {
      console.log(`Approving NFT #${tokenId} for marketplace...`);
      const txApprove = await nftContract.approve(MARKETPLACE_ADDRESS, tokenId, {
        gasLimit: 100000 
      });
      await txApprove.wait();
      console.log("Approval confirmed.");
    } else {
      console.log("NFT already approved for marketplace.");
    }

    // 3. Create listing
    const priceWei = ethers.parseUnits(priceInUsdc, 6);
    console.log(`Listing NFT #${tokenId} for ${priceInUsdc} USDC...`);
    
    const txList = await marketplace.list(tokenId, priceWei, {
      gasLimit: 300000 
    });
    
    await txList.wait();
    console.log("Listing successful!");
  } catch (error: any) {
    console.error("Detailed listing error:", error);
    throw error;
  }
};

/**
 * Buys a listed NFT. Handles USDC approval automatically.
 */
export const buyNFT = async (signer: ethers.Signer, tokenId: number, priceInUsdc: string) => {
  const marketplace = getMarketplaceContract(signer);
  const usdc = getUsdcContract(signer);
  const priceWei = ethers.parseUnits(priceInUsdc, 6);
  const userAddress = await signer.getAddress();

  // 1. Check allowance and approve USDC if needed
  const allowance = await usdc.allowance(userAddress, MARKETPLACE_ADDRESS);
  if (allowance < priceWei) {
    console.log("Approving USDC for purchase...");
    const txApprove = await usdc.approve(MARKETPLACE_ADDRESS, priceWei, {
      gasLimit: 100000
    });
    await txApprove.wait();
  }

  // 2. Execute buy transaction
  console.log(`Buying NFT #${tokenId} for ${priceInUsdc} USDC...`);
  const txBuy = await marketplace.buy(tokenId, {
    gasLimit: 300000
  });
  await txBuy.wait();
};

/**
 * Cancels an active listing
 */
export const cancelListing = async (signer: ethers.Signer, tokenId: number) => {
  const marketplace = getMarketplaceContract(signer);
  console.log(`Cancelling listing for NFT #${tokenId}...`);
  const txCancel = await marketplace.cancel(tokenId, {
    gasLimit: 200000
  });
  await txCancel.wait();
};
