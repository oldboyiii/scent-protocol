// Chain constants and helpers for the MFW 2026 mint.
import { ethers } from "ethers";

export const MFW_ADDRESS = "0x2Eb16402a50EE92bc3012038A0059ac4e9f7dF20";
export const GENESIS_ADDRESS = "0x37D6a1c730B8DdbB70aD765B39b1edc5Dad12EF6";
export const USDC_ADDRESS = "0x3600000000000000000000000000000000000000";
export const MAX_SUPPLY = 500;
export const MAX_PER_WALLET = 3;
export const MIN_WAIT = 30;
export const DEADLINE = 600;
export const RPC_URL = "https://rpc.mainnet.arc.io";

export const MFW_ABI = [
  "function requestMint(bytes32 seedCommitment) external returns (uint256)",
  "function revealAndMint(uint256 tokenId, bytes32 seedPreimage) external",
  "function cancelMint(uint256 tokenId) external",
  "function claimRefund() external",
  "function claimableRefunds(address) external view returns (uint256)",
  "function getMintPrice(address minter) external view returns (uint256)",
  "function getRemainingSupply() external view returns (uint256)",
  "function getWalletMintedCount(address wallet) external view returns (uint256)",
  "function getNextTokenId() external view returns (uint256)",
  "function hasExclusiveBadge(address) external view returns (bool)",
  "function getPerfume(uint256 tokenId) external view returns (tuple(uint256 tokenId, string name, uint8 gender, uint8 pType, string[3] topNotes, string[3] heartNotes, string[3] baseNotes, uint8 concentration, uint8 rarity, uint256 createdAt, address creator, bool hasExclusiveBadge))",
  "function pendingMints(uint256) external view returns (address minter, uint256 timestamp, uint256 blockNumber, uint256 paidAmount, bytes32 seedCommitment)",
  "event MintRequested(uint256 indexed tokenId, address indexed minter, uint256 blockNumber)",
];

export const USDC_ABI = [
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function allowance(address owner, address spender) external view returns (uint256)",
];

export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
export const readProvider = () => new ethers.JsonRpcProvider(RPC_URL);

export function walletProvider(): ethers.BrowserProvider {
  const eth = (window as unknown as { ethereum?: ethers.Eip1193Provider }).ethereum;
  if (!eth) throw new Error("No wallet found. Connect a wallet first.");
  return new ethers.BrowserProvider(eth);
}

export function seedMessage(address: string): string {
  return [
    "ScentProtocol MFW 2026: private reveal key",
    `Wallet: ${address.toLowerCase()}`,
    `Contract: ${MFW_ADDRESS.toLowerCase()}`,
    "Signing only creates your private reveal key. It costs no gas and sends no funds.",
  ].join("\n");
}

export function explain(err: unknown): string {
  const e = err as { code?: string | number; reason?: string; shortMessage?: string; message?: string };
  if (e.code === 4001 || e.code === "ACTION_REJECTED") return "Rejected in your wallet.";
  const text = e.reason || e.shortMessage || e.message || "";
  if (/Max per wallet/i.test(text)) return "You have reached the limit of 3 per wallet.";
  if (/Max supply/i.test(text)) return "The collection is sold out.";
  if (/Reveal window passed/i.test(text)) return "The 10 minute reveal window closed. Use Recover to get 50% back.";
  if (/Too early/i.test(text)) return "Not ready yet. The 30 second wait is still running.";
  if (/insufficient|exceeds balance/i.test(text)) return "Not enough USDC in your wallet.";
  return text.slice(0, 200) || "Something went wrong. Try again.";
}

export interface MfwPerfume {
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

export function toPerfume(d: ethers.Result): MfwPerfume {
  return {
    name: d.name,
    gender: Number(d.gender),
    pType: Number(d.pType),
    topNotes: Array.from(d.topNotes as string[]).map(String),
    heartNotes: Array.from(d.heartNotes as string[]).map(String),
    baseNotes: Array.from(d.baseNotes as string[]).map(String),
    concentration: Number(d.concentration),
    rarity: Number(d.rarity),
    createdAt: Number(d.createdAt),
    creator: d.creator,
  };
}
