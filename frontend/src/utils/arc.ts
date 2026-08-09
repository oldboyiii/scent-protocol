export const ARC_CONFIG = {
  chainId: parseInt(process.env.NEXT_PUBLIC_CHAIN_ID || "5042002"),
  rpcUrl: process.env.NEXT_PUBLIC_RPC_URL || "https://rpc.testnet.arc.network",
  name: "Arc Testnet",
  nativeCurrency: {
    name: "USDC",
    symbol: "USDC",
    decimals: 6,
  },
  blockExplorer: "https://testnet.arcscan.app",
};

export async function addArcNetwork() {
  if (typeof window === "undefined" || !window.ethereum) return false;

  try {
    await window.ethereum.request({
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
  if (typeof window === "undefined" || !window.ethereum) return false;

  try {
    await window.ethereum.request({
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
