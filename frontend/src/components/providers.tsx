"use client";

import type { ReactNode } from "react";
import { PrivyProvider } from "@privy-io/react-auth";
import { baseSepolia, anvil, getChain, config } from "@/lib/chainConfig";
import { WagmiProvider } from "@privy-io/wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

export function Providers(props: { children: ReactNode }) {
    // Use localhost for development, Sepolia for production
    const defaultChain = getChain();
    const queryClient = new QueryClient();

    return (
        <PrivyProvider
            appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID!}
            clientId={process.env.NEXT_PUBLIC_PRIVY_CLIENT_ID!}
            config={{
                // Create embedded wallets for users who don't have a wallet
                embeddedWallets: {
                    ethereum: {
                        createOnLogin: "all-users",
                    },
                },
                defaultChain,
                supportedChains: [baseSepolia, anvil],
            }}
        >
            <QueryClientProvider client={queryClient}>
                <WagmiProvider config={config}>{props.children}</WagmiProvider>
            </QueryClientProvider>
        </PrivyProvider>
    );
}
