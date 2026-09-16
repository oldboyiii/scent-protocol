"use client";

import { ethers } from "ethers";

export const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "0x8d456e033FF7220068CDc1C3F08D6BA6641D103e";
export const USDC_ADDRESS = process.env.NEXT_PUBLIC_USDC_ADDRESS || "0x3600000000000000000000000000000000000000";
export const GENESIS_ADDRESS = "0x1152E29703313B49BAD9560af64458E24C785E2B";

export const SCENT_PROTOCOL_ABI = [
  "function balanceOf(address account) external view returns (uint256)",
  "function ownerOf(uint256 tokenId) external view returns (address)",
  "function approve(address to, uint256 tokenId) external",
  "function getApproved(uint256 tokenId) external view returns (address)",
  "function setApprovalForAll(address operator, bool approved) external",
  "function isApprovedForAll(address _owner, address operator) external view returns (bool)",
  "function transferFrom(address from, address to, uint256 tokenId) external",
  "function setMintPrice(uint256 newPrice) external",
  "function setFeeRecipient(address newRecipient) external",
  "function requestMint() external returns (uint256)",
  "function revealAndMint(uint256 tokenId, uint256 userSeed) external",
  "function getPerfume(uint256 tokenId) external view returns (tuple(uint256 tokenId, string name, uint8 gender, uint8 pType, string[3] topNotes, string[3] heartNotes, string[3] baseNotes, uint8 concentration, uint8 rarity, uint256 createdAt, address creator))",
  "function getOwnerTokens(address owner) external view returns (uint256[])",
  "function getMintPrice() external view returns (uint256)",
  "function getFeeRecipient() external view returns (address)",
  "function getNextTokenId() external view returns (uint256)",
  "function getPendingMint(uint256 tokenId) external view returns (tuple(address minter, uint256 blockNumber, uint256 amount))",
  "function usdc() external view returns (address)",
  "function owner() external view returns (address)",
  "event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)",
  "event MintRequested(uint256 indexed tokenId, address indexed minter, uint256 blockNumber)",
  "event PerfumeCreated(uint256 indexed tokenId, address indexed creator, uint8 rarity)",
];

export const GENESIS_ABI = [
  "function requestMint() external returns (uint256)",
  "function revealAndMint(uint256 tokenId, uint256 userSeed) external",
  "function getPerfume(uint256 tokenId) external view returns (tuple(uint256 tokenId, string name, uint8 gender, uint8 pType, string[3] topNotes, string[3] heartNotes, string[3] baseNotes, uint8 concentration, uint8 rarity, uint256 createdAt, address creator, bool isGenesis))",
  "function getRemainingSupply() external view returns (uint256)",
  "function getWalletMintedCount(address wallet) external view returns (uint256)",
  "function getNextTokenId() external view returns (uint256)",
  "event MintRequested(uint256 indexed tokenId, address indexed minter, uint256 blockNumber)",
  "event PerfumeCreated(uint256 indexed tokenId, address indexed creator, uint8 rarity)",
];

export const USDC_ABI = [
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function allowance(address owner, address spender) external view returns (uint256)",
  "function balanceOf(address account) external view returns (uint256)",
  "function decimals() external view returns (uint8)",
  "function transferFrom(address sender, address recipient, uint256 amount) external returns (bool)",
  "function transfer(address recipient, uint256 amount) external returns (bool)",
];

export function getProvider() {
  return new ethers.JsonRpcProvider(process.env.NEXT_PUBLIC_RPC_URL);
}

export function getContract(signerOrProvider: ethers.Signer | ethers.Provider) {
  return new ethers.Contract(CONTRACT_ADDRESS, SCENT_PROTOCOL_ABI, signerOrProvider);
}

export function getGenesisContract(signerOrProvider: ethers.Signer | ethers.Provider) {
  return new ethers.Contract(GENESIS_ADDRESS, GENESIS_ABI, signerOrProvider);
}

export function getUSDCContract(signerOrProvider: ethers.Signer | ethers.Provider) {
  return new ethers.Contract(USDC_ADDRESS, USDC_ABI, signerOrProvider);
}

export const GENDER_MAP = ["Unisex", "Male", "Female"];
export const TYPE_MAP = ["Parfum", "EDP", "EDT", "EDC"];
export const RARITY_MAP = ["Common", "Rare", "Epic", "Legendary"];
export const RARITY_COLORS = ["text-gray-400", "text-blue-400", "text-purple-400", "text-yellow-400"];

export interface PerfumeData {
  name: string;
  gender: number;
  pType: number;
  topNotes: string[];
  heartNotes: string[];
  baseNotes: string[];
  concentration: number;
  rarity: number;
  createdAt: number;
  creator: string;
}
