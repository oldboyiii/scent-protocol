import { ethers } from "ethers";

// Deployed Marketplace Contract Address on Arc Mainnet
export const MARKETPLACE_ADDRESS = "0xe7Cc5d3e31AB0b2F8f1bFAc0A3FeB17b37333120";
export const USDC_ADDRESS = "0x3600000000000000000000000000000000000000";

const MARKETPLACE_ABI = [
  "function list(address nft, uint256 tokenId, uint256 price, uint256 expiry)",
  "function cancelListing(address nft, uint256 tokenId)",
  "function buy(address nft, uint256 tokenId, uint256 expectedPrice)",
  "function listings(address, uint256) view returns (address seller, uint256 price, uint256 expiry, uint16 feeBps)",
  "function getActiveListings(address nft) view returns (uint256[])",
  "function getActiveCount() view returns (uint256)",
  "function usdc() view returns (address)"
];

const ERC20_ABI = [
  "function allowance(address owner, address spender) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function balanceOf(address account) view returns (uint256)"
];

const NFT_ABI = [
  "function setApprovalForAll(address operator, bool approved)",
  "function isApprovedForAll(address owner, address operator) view returns (bool)"
];

/**
 * Patches a BrowserProvider instance to completely disable ENS resolution.
 */
const patchProviderForArc = (provider: ethers.BrowserProvider): ethers.BrowserProvider => {
  provider.resolveName = async (name: string): Promise<string | null> => {
    if (!name || !name.endsWith('.eth')) return name;
    return null;
  };

  (provider as any)._getEnsAddress = async (): Promise<null> => null;
  (provider as any).getEnsName = async (): Promise<null> => null;

  const originalGetNetwork = provider.getNetwork.bind(provider);
  provider.getNetwork = async () => {
    const network = await originalGetNetwork();
    (network as any).ensAddress = null;
    return network;
  };

  return provider;
};

/**
 * CUSTOM ARC SIGNER WRAPPER
 * Wraps the native signer to intercept sendTransaction and prevent ENS errors.
 * Does NOT extend ethers.Signer to avoid TS compilation issues.
 */
export class ArcSigner {
  private _signer: ethers.JsonRpcSigner;
  private _provider: ethers.BrowserProvider;

  constructor(signer: ethers.JsonRpcSigner, provider: ethers.BrowserProvider) {
    this._signer = signer;
    this._provider = provider;
    patchProviderForArc(this._provider);
  }

  get provider(): ethers.Provider {
    return this._provider;
  }

  async getAddress(): Promise<string> {
    return this._signer.getAddress();
  }

  async signMessage(message: string | Uint8Array): Promise<string> {
    return this._signer.signMessage(message);
  }

  /**
   * CRITICAL: Intercepts transaction sending to strip ENS metadata
   * and retry if UNSUPPORTED_OPERATION occurs.
   */
  async sendTransaction(transaction: ethers.TransactionRequest): Promise<ethers.TransactionResponse> {
    const safeTx = { ...transaction };
    
    try {
      return await this._signer.sendTransaction(safeTx);
    } catch (error: any) {
      // Catch the specific ENS error from ethers v6.17+
      if (error.code === "UNSUPPORTED_OPERATION" && error.operation?.includes("Ens")) {
        console.warn("[ArcSigner] ENS operation blocked by network. Retrying with stripped transaction...");
        
        // Retry with minimal transaction object to bypass ENS checks
        return await this._signer.sendTransaction({
          to: safeTx.to,
          value: safeTx.value,
          data: safeTx.data,
          gasLimit: safeTx.gasLimit,
          maxFeePerGas: safeTx.maxFeePerGas,
          maxPriorityFeePerGas: safeTx.maxPriorityFeePerGas,
          nonce: safeTx.nonce,
          type: 2 // Force EIP-1559
        });
      }
      throw error;
    }
  }
}

/**
 * Factory function to create the safe Arc signer
 */
export const getArcSigner = async (): Promise<ArcSigner> => {
  const win = window as any;
  if (!win.ethereum) throw new Error("No Ethereum provider found");
  
  const provider = new ethers.BrowserProvider(win.ethereum);
  patchProviderForArc(provider);
  
  const signer = await provider.getSigner();
  return new ArcSigner(signer, provider);
};

// Helper to create contracts compatible with our ArcSigner wrapper
const createContract = (address: string, abi: any, signerOrProvider: ArcSigner | ethers.Provider) => {
  if (signerOrProvider instanceof ArcSigner) {
    return new ethers.Contract(address, abi, signerOrProvider as any);
  }
  return new ethers.Contract(address, abi, signerOrProvider);
};

export const getMarketplaceContract = (signerOrProvider: ArcSigner | ethers.Provider) => 
  createContract(MARKETPLACE_ADDRESS, MARKETPLACE_ABI, signerOrProvider);

export const getUsdcContract = (signerOrProvider: ArcSigner | ethers.Provider) => 
  createContract(USDC_ADDRESS, ERC20_ABI, signerOrProvider);

export const fetchActiveListings = async (provider: ethers.Provider, nftAddress: string) => {
  try {
    const contract = getMarketplaceContract(provider);
    const activeIds = await contract.getActiveListings(nftAddress);
    const listings = [];
    const now = Math.floor(Date.now() / 1000);
    
    for (const tokenId of activeIds) {
      const data = await contract.listings(nftAddress, tokenId);
      if (data.seller !== ethers.ZeroAddress && Number(data.expiry) > now) {
        listings.push({ 
          tokenId: Number(tokenId), 
          seller: data.seller, 
          price: data.price, 
          active: true,
          expiry: Number(data.expiry)
        });
      }
    }
    return listings;
  } catch (e) { 
    console.error("Fetch listings error:", e); 
    return []; 
  }
};

export const checkIfListed = async (provider: ethers.Provider, nftAddress: string, tokenId: number) => {
  try {
    const data = await getMarketplaceContract(provider).listings(nftAddress, tokenId);
    const now = Math.floor(Date.now() / 1000);
    const isActive = data.seller !== ethers.ZeroAddress && Number(data.expiry) > now;
    return { 
      active: isActive, 
      seller: data.seller, 
      price: data.price,
      expiry: Number(data.expiry)
    };
  } catch { 
    return { active: false, seller: ethers.ZeroAddress, price: 0n, expiry: 0 }; 
  }
};

export const listNFT = async (signer: ArcSigner, nftAddress: string, tokenId: number, priceUsdc: string, expiry: number) => {
  const provider = signer.provider;
  const userAddress = await signer.getAddress();
  const nftContractRead = new ethers.Contract(nftAddress, NFT_ABI, provider);
  
  let needsApproval = true;
  try {
    const isApproved = await nftContractRead.isApprovedForAll.staticCall(userAddress, MARKETPLACE_ADDRESS);
    needsApproval = !isApproved;
  } catch (e) { 
    console.warn("Approval check skipped, forcing approve"); 
  }

  if (needsApproval) {
    console.log(`Approving NFT #${tokenId} for marketplace...`);
    const nftContractWrite = new ethers.Contract(nftAddress, NFT_ABI, signer as any);
    await (await nftContractWrite.setApprovalForAll(MARKETPLACE_ADDRESS, true, { gasLimit: 100000 })).wait();
  }

  console.log(`Listing NFT #${tokenId} for ${priceUsdc} USDC...`);
  const market = getMarketplaceContract(signer);
  const priceWei = ethers.parseUnits(priceUsdc, 6);
  const tx = await market.list(nftAddress, tokenId, priceWei, expiry, { gasLimit: 300000 });
  await tx.wait();
};

export const buyNFT = async (signer: ArcSigner, nftAddress: string, tokenId: number, priceUsdc: string) => {
  const market = getMarketplaceContract(signer);
  const usdc = getUsdcContract(signer);
  const priceWei = ethers.parseUnits(priceUsdc, 6);
  const addr = await signer.getAddress();

  // 1. Check balance
  const balance = await usdc.balanceOf(addr);
  if (balance < priceWei) {
    throw new Error(`Insufficient USDC balance. Need: ${priceUsdc} USDC`);
  }

  // 2. Check and set allowance
  const allowance = await usdc.allowance(addr, MARKETPLACE_ADDRESS);
  if (allowance < priceWei) {
    console.log("Approving USDC...");
    if (allowance > 0n) {
      await (await usdc.approve(MARKETPLACE_ADDRESS, 0n, { gasLimit: 100000 })).wait();
      await new Promise(r => setTimeout(r, 1500));
    }
    await (await usdc.approve(MARKETPLACE_ADDRESS, ethers.MaxUint256, { gasLimit: 100000 })).wait();
    await new Promise(r => setTimeout(r, 2000));
  }

  // 3. Execute buy (with expectedPrice for slippage protection)
  console.log(`Buying NFT #${tokenId}...`);
  await (await market.buy(nftAddress, tokenId, priceWei, { gasLimit: 300000 })).wait();
};

export const cancelListing = async (signer: ArcSigner, nftAddress: string, tokenId: number) => {
  console.log(`Cancelling listing #${tokenId}...`);
  await (await getMarketplaceContract(signer).cancelListing(nftAddress, tokenId, { gasLimit: 200000 })).wait();
};
