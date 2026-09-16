export const ARC_CONFIG = {
  chainId: parseInt(process.env.NEXT_PUBLIC_CHAIN_ID || "5042"), // 5042 is Arc Mainnet
  rpcUrl: process.env.NEXT_PUBLIC_RPC_URL || "https://rpc.mainnet.arc.io", // Mainnet RPC
  name: "Arc Mainnet",
  nativeCurrency: {
    name: "USDC",
    symbol: "USDC",
    decimals: 18, // 18 decimals for correct native gas balance display in MetaMask
  },
  blockExplorer: "https://explorer.arc.io", // Mainnet Explorer
};

export async function addArcNetwork() {
  const w = window as any;
  if (typeof window === "undefined" || !w.ethereum) return false;

  try {
    await w.ethereum.request({
      method: "wallet_addEthereumChain",
      params: [
        {
          chainId: `0x${ARC_CONFIG.chainId.toString(16)}`,
          chainName: ARC_CONFIG.name,
          nativeCurrency: ARC_CONFIG.nativeCurrency,
          rpcUrls: [ARC_CONFIG.rpcUrl],
          blockExplorerUrls: [ARC_CONFIG.blockExplorer],
        },
      ],
    });
    return true;
  } catch (error) {
    console.error("Failed to add Arc network:", error);
    return false;
  }
}

export async function switchToArc() {
  const w = window as any;
  if (typeof window === "undefined" || !w.ethereum) return false;

  try {
    await w.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: `0x${ARC_CONFIG.chainId.toString(16)}` }],
    });
    return true;
  } catch (error: any) {
    if (error.code === 4902) {
      return addArcNetwork();
    }
    console.error("Failed to switch to Arc:", error);
    return false;
  }
}
