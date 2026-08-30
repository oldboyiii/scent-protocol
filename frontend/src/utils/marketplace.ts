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
 * Instead of extending ethers.Signer (which causes TS errors), 
 * we wrap the native signer and proxy all calls, intercepting sendTransaction.
 */
export class ArcSigner {
  private _signer: ethers.JsonRpcSigner;
  private _provider: ethers.BrowserProvider;

  constructor(signer: ethers.JsonRpcSigner, provider: ethers.BrowserProvider) {
    this._signer = signer;
    this._provider = provider;
    patchProviderForArc(this._provider);
  }

  // Expose provider for read-only operations
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
          type: 2 // Force EIP-1559 to avoid legacy tx issues
        });
      }
      throw error;
    }
  }

  // Proxy other methods if needed by contracts
  async populateTransaction(transaction: ethers.TransactionRequest): Promise<ethers.PopulatedTransaction> {
    return this._signer.populateTransaction(transaction);
  }
  
  async estimateGas(transaction: ethers.TransactionRequest): Promise<bigint> {
    return this._signer.estimateGas(transaction);
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

export const getMarketplaceContract = (signerOrProvider: ArcSigner | ethers.Provider) => {
  // If it's our wrapper, use its internal signer/provider logic
  // But Contract expects standard Signer/Provider. 
  // Since ArcSigner wraps them, we pass the underlying objects where possible,
  // or rely on the fact that Contract accepts any object with provider/signer methods.
  // For safety, we cast or use the internal _signer if available via type check.
  if (signerOrProvider instanceof ArcSigner) {
     // We need to pass something ethers.Contract understands.
     // Since ArcSigner isn't a real ethers.Signer, we might face issues with Contract interaction.
     // FIX: We will make ArcSigner compatible by exposing necessary props or 
     // simply passing the underlying signer to Contract but wrapping the sendTransaction call.
     
     // BETTER APPROACH FOR CONTRACTS:
     // Create a contract with the underlying signer, but monkey-patch its sendTransaction?
     // No, let's stick to the wrapper but ensure Contract can use it.
     // Actually, ethers.Contract checks for `sendTransaction` method. Our wrapper has it!
     // So passing `this` should work for write operations.
     return new ethers.Contract(MARKETPLACE_ADDRESS, MARKETPLACE_ABI, signerOrProvider as any);
  }
  return new ethers.Contract(MARKETPLACE_ADDRESS, MARKETPLACE_ABI, signerOrProvider);
};

export const getUsdcContract = (signerOrProvider: ArcSigner | ethers.Provider) => {
  if (signerOrProvider instanceof ArcSigner) {
    return new ethers.Contract(USDC_ADDRESS, ERC20_ABI, signerOrProvider as any);
  }
  return new ethers.Contract(USDC_ADDRESS, ERC20_ABI, signerOrProvider);
};

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

export const listNFT = async (signer: ArcSigner, nftAddress: string, tokenId: number, priceUsdc: string) => {
  // For read-only calls like getApproved, we might need the underlying signer/provider
  // But since ArcSigner doesn't expose call/estimateGas fully, let's add a helper or use provider for reads
  
  // NOTE: For staticCall/approve, we ideally want the real signer. 
  // But our wrapper handles sendTransaction which is what matters for writing.
  // For reading getApproved, we can use the provider directly.
  
  const provider = signer.provider;
  const nftContractRead = new ethers.Contract(nftAddress, NFT_ABI, provider);
  
  let needsApproval = true;
  try {
    const approved = await nftContractRead.getApproved.staticCall(tokenId);
    needsApproval = approved.toLowerCase() !== MARKETPLACE_ADDRESS.toLowerCase();
  } catch (e) { 
    console.warn("Approval check skipped, forcing approve"); 
  }

  if (needsApproval) {
    console.log(`Approving NFT #${tokenId}...`);
    // For writing, we use our wrapped signer via getMarketplaceContract? 
    // No, NFT contract needs its own instance.
    // Let's create a generic contract factory that uses our signer.
    const nftContractWrite = new ethers.Contract(nftAddress, NFT_ABI, signer as any);
    await (await nftContractWrite.approve(MARKETPLACE_ADDRESS, tokenId, { gasLimit: 100000 })).wait();
  }

  console.log(`Listing NFT #${tokenId} for ${priceUsdc} USDC...`);
  const market = getMarketplaceContract(signer);
  const tx = await market.list(tokenId, ethers.parseUnits(priceUsdc, 6), { gasLimit: 300000 });
  await tx.wait();
};

export const buyNFT = async (signer: ArcSigner, tokenId: number, priceUsdc: string) => {
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

export const cancelListing = async (signer: ArcSigner, tokenId: number) => {
  console.log(`Cancelling listing #${tokenId}...`);
  await (await getMarketplaceContract(signer).cancel(tokenId, { gasLimit: 200000 })).wait();
};
