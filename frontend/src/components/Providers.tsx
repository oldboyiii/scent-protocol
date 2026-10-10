// frontend/src/components/Providers.tsx
"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider } from "wagmi";
import { ConnectKitProvider } from "connectkit";
import { config } from "@/config/wagmi";
import { useState } from "react";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <ConnectKitProvider theme="midnight" customTheme={{
          "--ck-border-radius": "12px",
          "--ck-font-family": "inherit",
          "--ck-body-background": "#0a0a1a",
          "--ck-body-background-secondary": "#1a1a2e",
          "--ck-body-background-tertiary": "#2a2a3e",
          "--ck-body-color": "#ffffff",
          "--ck-body-color-muted": "#ffffff80",
          "--ck-accent-color": "#f59e0b",
          "--ck-accent-text-color": "#ffffff",
          "--ck-overlay-background": "#000000cc",
        }}>
          {children}
        </ConnectKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
