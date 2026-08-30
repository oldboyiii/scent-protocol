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
 * CUSTOM ARC SIGNER
 * Wraps the browser signer and overrides all ENS-related methods to return null.
 * This prevents ethers v6.17+ from throwing UNSUPPORTED_OPERATION during transactions.
 */
class ArcSigner extends ethers.Signer {
  private _signer: ethers.JsonRpcSigner;
  private _provider: ethers.BrowserProvider;

  constructor(signer: ethers.JsonRpcSigner, provider: ethers.BrowserProvider) {
    super();
    this._signer = signer;
    this._provider = provider;
    
    // Patch the underlying provider of the signer as well
    patchProviderForArc(this._provider);
  }

  connect(provider: ethers.Provider): ethers.Signer {
    return new ArcSigner(this._signer.connect(provider) as any, this._provider);
  }

  async getAddress(): Promise<string> {
    return this._signer.getAddress();
  }

  async signMessage(message: string | Uint8Array): Promise<string> {
    return this._signer.signMessage(message);
  }

  async signTransaction(transaction: ethers.TransactionRequest): Promise<string> {
    const safeTx = { ...transaction };
    delete (safeTx as any).ensName; 
    return this._signer.signTransaction(safeTx);
  }

  async sendTransaction(transaction: ethers.TransactionRequest): Promise<ethers.TransactionResponse> {
    const safeTx = { ...transaction };
    
    try {
      return await this._signer.sendTransaction(safeTx);
    } catch (error: any) {
      if (error.code === "UNSUPPORTED_OPERATION" && error.operation?.includes("Ens")) {
        console.error("[ArcSigner] ENS operation blocked. Retrying with stripped transaction...");
        return await this._signer.sendTransaction({
          to: safeTx.to,
          value: safeTx.value,
          data: safeTx.data,
          gasLimit: safeTx.gasLimit,
          maxFeePerGas: safeTx.maxFeePerGas,
          maxPriorityFeePerGas: safeTx.maxPriorityFeePerGas,
          nonce: safeTx.nonce
        });
      }
      throw error;
    }
  }

  async populateCall(transaction: ethers.TransactionRequest): Promise<ethers.PopulatedTransaction> {
    return this._signer.populateCall(transaction);
  }

  async populateTransaction(transaction: ethers.TransactionRequest): Promise<ethers.PopulatedTransaction> {
    return this._signer.populateTransaction(transaction);
  }

  async estimateGas(transaction: ethers.TransactionRequest): Promise<bigint> {
    return this._signer.estimateGas(transaction);
  }

  async call(transaction: ethers.TransactionRequest): Promise<string> {
    return this._signer.call(transaction);
  }

  async resolveName(name: string): Promise<string | null> {
    if (!name.endsWith('.eth')) return name;
    return null;
  }

  get provider(): ethers.Provider {
    return this._provider;
  }
}

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
 * Factory function to create the safe Arc provider AND signer
 */
export const getArcSigner = async (): Promise<ArcSigner> => {
  const win = window as any;
  if (!win.ethereum) throw new Error("No Ethereum provider found");
  
  const provider = new ethers.BrowserProvider(win.ethereum);
  patchProviderForArc(provider);
  
  const signer = await provider.getSigner();
  return new ArcSigner(signer, provider);
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

export const listNFT = async (signer: ArcSigner, nftAddress: string, tokenId: number, priceUsdc: string) => {
  const nft = new ethers.Contract(nftAddress, NFT_ABI, signer);
  const market = getMarketplaceContract(signer);

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
