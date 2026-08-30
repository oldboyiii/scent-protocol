import { ethers } from "ethers";

// Deployed Marketplace Contract Address on Arc Testnet
export const MARKETPLACE_ADDRESS = "0x23d2F6655F23D245348ce6Db11e07eab823E6D66";
export const USDC_ADDRESS = "0x3600000000000000000000000000000000000000";

const MARKETPLACE_ABI = [
  "function listings(uint256) view returns (address seller, uint256 price, bool active)",
  "function activeTokenIds(uint256) view returns (uint256)",
  "function getActiveCount() view returns (uint256)",
  "function list(uint256 tokenId, uint256 price)",
  "function buy(uint256 tokenId)",
  "function cancel(uint256 tokenId)"
];

const ERC20_ABI = [
  "function allowance(address owner, address spender) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)"
];

const NFT_ABI = [
  "function approve(address to, uint256 tokenId)",
  "function getApproved(uint256 tokenId) view returns (address)"
];

/**
 * CUSTOM ARC PROVIDER CLASS
 * Completely overrides ENS resolution at the provider level.
 * Fixes "UNSUPPORTED_OPERATION" errors in ethers v6 for custom chains.
 */
class ArcProvider extends ethers.BrowserProvider {
  constructor(ethereum: any) {
    super(ethereum);
    
    // Override resolveName to NEVER attempt ENS resolution
    this.resolveName = async (name: string): Promise<string | null> => {
      if (!name || !name.endsWith('.eth')) return name;
      console.warn(`[ArcProvider] Blocked ENS resolution for: ${name}`);
      return null;
    };

    // Override INTERNAL _getEnsAddress to ALWAYS return null
    // We use 'any' cast because this method is private in ethers v6 types
    (this as any)._getEnsAddress = async (name: string): Promise<string | null> => {
      console.warn(`[ArcProvider] Blocked internal _getEnsAddress for: ${name}`);
      return null;
    };

    // Override getEnsName using 'any' cast to bypass TypeScript strictness
    // This prevents reverse ENS lookups which also fail on Arc
    (this as any).getEnsName = async (address: string): Promise<string | null> => {
      return null;
    };
  }

  // Force network config to have no ENS
  async getNetwork(): Promise<ethers.Network> {
    const network = await super.getNetwork();
    // Mutate the network object directly
    (network as any).ensAddress = null;
    (network as any)._defaultProvider = undefined;
    return network;
  }
}
    };

    // Override INTERNAL _getEnsAddress to ALWAYS return null
    // We use 'any' cast because this method is private in ethers v6 types
    (this as any)._getEnsAddress = async (name: string): Promise<string | null> => {
      console.warn(`[ArcProvider] Blocked internal _getEnsAddress for: ${name}`);
      return null;
    };

    // Override getEnsName to ALWAYS return null
    this.getEnsName = async (address: string): Promise<string | null> => {
      return null;
    };
  }

  // Force network config to have no ENS
  async getNetwork(): Promise<ethers.Network> {
    const network = await super.getNetwork();
    // Mutate the network object directly
    (network as any).ensAddress = null;
    (network as any)._defaultProvider = undefined;
    return network;
  }
}

/**
 * Factory function to create the safe Arc provider
 */
export const getArcProvider = (): ArcProvider => {
  const win = window as any;
  if (!win.ethereum) throw new Error("No Ethereum provider found");
  return new ArcProvider(win.ethereum);
};

export const getMarketplaceContract = (signerOrProvider: ethers.Signer | ethers.Provider) => 
  new ethers.Contract(MARKETPLACE_ADDRESS, MARKETPLACE_ABI, signerOrProvider);

export const getUsdcContract = (signerOrProvider: ethers.Signer | ethers.Provider) => 
  new ethers.Contract(USDC_ADDRESS, ERC20_ABI, signerOrProvider);

export const fetchActiveListings = async (provider: ethers.Provider) => {
  try {
    const contract = getMarketplaceContract(provider);
    const count = await contract.getActiveCount();
    const listings = [];
    for (let i = 0; i < Number(count); i++) {
      const tokenId = await contract.activeTokenIds(i);
      const data = await contract.listings(tokenId);
      if (data.active) listings.push({ tokenId: Number(tokenId), seller: data.seller, price: data.price, active: true });
    }
    return listings;
  } catch (e) { console.error("Fetch listings error:", e); return []; }
};

export const checkIfListed = async (provider: ethers.Provider, tokenId: number) => {
  try {
    const data = await getMarketplaceContract(provider).listings(tokenId);
    return { active: data.active, seller: data.seller, price: data.price };
  } catch { return { active: false, seller: ethers.ZeroAddress, price: 0n }; }
};

export const listNFT = async (signer: ethers.Signer, nftAddress: string, tokenId: number, priceUsdc: string) => {
  const nft = new ethers.Contract(nftAddress, NFT_ABI, signer);
  const market = getMarketplaceContract(signer);

  // Safe approval check using staticCall
  let needsApproval = true;
  try {
    const approved = await nft.getApproved.staticCall(tokenId);
    needsApproval = approved.toLowerCase() !== MARKETPLACE_ADDRESS.toLowerCase();
  } catch (e) { 
    console.warn("Approval check skipped, forcing approve"); 
  }

  if (needsApproval) {
    console.log(`Approving NFT #${tokenId}...`);
    await (await nft.approve(MARKETPLACE_ADDRESS, tokenId, { gasLimit: 100000 })).wait();
  }

  console.log(`Listing NFT #${tokenId} for ${priceUsdc} USDC...`);
  const tx = await market.list(tokenId, ethers.parseUnits(priceUsdc, 6), { gasLimit: 300000 });
  await tx.wait();
};

export const buyNFT = async (signer: ethers.Signer, tokenId: number, priceUsdc: string) => {
  const market = getMarketplaceContract(signer);
  const usdc = getUsdcContract(signer);
  const priceWei = ethers.parseUnits(priceUsdc, 6);
  const addr = await signer.getAddress();

  const allowance = await usdc.allowance(addr, MARKETPLACE_ADDRESS);
  if (allowance < priceWei) {
    console.log("Approving USDC...");
    await (await usdc.approve(MARKETPLACE_ADDRESS, priceWei, { gasLimit: 100000 })).wait();
  }

  console.log(`Buying NFT #${tokenId}...`);
  await (await market.buy(tokenId, { gasLimit: 300000 })).wait();
};

export const cancelListing = async (signer: ethers.Signer, tokenId: number) => {
  console.log(`Cancelling listing #${tokenId}...`);
  await (await getMarketplaceContract(signer).cancel(tokenId, { gasLimit: 200000 })).wait();
};
