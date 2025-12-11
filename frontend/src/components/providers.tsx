"use client";

import type { ReactNode } from "react";
import { PrivyProvider } from "@privy-io/react-auth";
import { baseSepolia, anvil } from "wagmi/chains";
import { WagmiProvider, createConfig, http } from "wagmi";

// Create Wagmi config
const config = createConfig({
    chains: [baseSepolia, anvil],
    transports: {
        [baseSepolia.id]: http(),
        [anvil.id]: http("http://127.0.0.1:8545"),
    },
});

export function Providers(props: { children: ReactNode }) {
    // Use localhost for development, Sepolia for production
    const defaultChain =
        process.env.NODE_ENV === "production" ? baseSepolia : anvil;

    return (
        <WagmiProvider config={config}>
            <PrivyProvider
                appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID!}
                clientId={process.env.NEXT_PUBLIC_PRIVY_CLIENT_ID!}
                config={{
                    // Create embedded wallets for users who don't have a wallet
                    embeddedWallets: {
                        ethereum: {
                            createOnLogin: "users-without-wallets",
                        },
                    },
                    defaultChain,
                    supportedChains: [baseSepolia, anvil],
                }}
            >
                {props.children}
            </PrivyProvider>
        </WagmiProvider>
    );
}
