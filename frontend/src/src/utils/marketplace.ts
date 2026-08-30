import { ethers } from "ethers";

// Deployed Marketplace Contract Address
export const MARKETPLACE_ADDRESS = "0x23d2F6655F23D245348ce6Db11e07eab823E6D66";
export const USDC_ADDRESS = "0x3600000000000000000000000000000000000000"; // Arc Network USDC

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
  "function approve(address spender, uint256 amount) returns (bool)"
];

const NFT_APPROVE_ABI = [
  "function approve(address to, uint256 tokenId)"
];

export const getMarketplaceContract = (signerOrProvider: ethers.Signer | ethers.Provider) => {
  return new ethers.Contract(MARKETPLACE_ADDRESS, MARKETPLACE_ABI, signerOrProvider);
};

export const getUsdcContract = (signerOrProvider: ethers.Signer | ethers.Provider) => {
  return new ethers.Contract(USDC_ADDRESS, ERC20_ABI, signerOrProvider);
};

// Fetch all active listings from the contract
export const fetchActiveListings = async (provider: ethers.Provider) => {
  const contract = getMarketplaceContract(provider);
  const count = await contract.getActiveCount();
  const listings = [];

  for (let i = 0; i < count; i++) {
    const tokenId = await contract.activeTokenIds(i);
    const listing = await contract.listings(tokenId);
    listings.push({
      tokenId: Number(tokenId),
      seller: listing.seller,
      price: listing.price,
      active: listing.active
    });
  }
  return listings;
};

// Check if a specific token is currently listed
export const checkIfListed = async (provider: ethers.Provider, tokenId: number) => {
  const contract = getMarketplaceContract(provider);
  const listing = await contract.listings(tokenId);
  return {
    active: listing.active,
    seller: listing.seller,
    price: listing.price
  };
};

// List an NFT for sale
export const listNFT = async (
  signer: ethers.Signer, 
  nftContractAddress: string, 
  tokenId: number, 
  priceInUsdc: string
) => {
  const nftContract = new ethers.Contract(nftContractAddress, NFT_APPROVE_ABI, signer);
  const marketplace = getMarketplaceContract(signer);

  // 1. Approve NFT transfer to marketplace
  const txApprove = await nftContract.approve(MARKETPLACE_ADDRESS, tokenId);
  await txApprove.wait();

  // 2. Create listing (USDC has 6 decimals)
  const priceWei = ethers.parseUnits(priceInUsdc, 6);
  const txList = await marketplace.list(tokenId, priceWei);
  await txList.wait();
};

// Buy a listed NFT
export const buyNFT = async (signer: ethers.Signer, tokenId: number, priceInUsdc: string) => {
  const marketplace = getMarketplaceContract(signer);
  const usdc = getUsdcContract(signer);
  const priceWei = ethers.parseUnits(priceInUsdc, 6);
  const userAddress = await signer.getAddress();

  // 1. Approve USDC spending
  const allowance = await usdc.allowance(userAddress, MARKETPLACE_ADDRESS);
  if (allowance < priceWei) {
    const txApprove = await usdc.approve(MARKETPLACE_ADDRESS, priceWei);
    await txApprove.wait();
  }

  // 2. Execute buy
  const txBuy = await marketplace.buy(tokenId);
  await txBuy.wait();
};

// Cancel an active listing
export const cancelListing = async (signer: ethers.Signer, tokenId: number) => {
  const marketplace = getMarketplaceContract(signer);
  const txCancel = await marketplace.cancel(tokenId);
  await txCancel.wait();
};
