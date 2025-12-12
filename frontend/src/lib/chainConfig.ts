// Central chain config for frontend
import { baseSepolia, anvil } from "viem/chains";
import { http } from "wagmi";
import { createConfig } from "@privy-io/wagmi";

export const getChain = () =>
    process.env.NODE_ENV === "development" ? anvil : baseSepolia;

export const getChainId = () =>
    process.env.NODE_ENV === "development" ? anvil.id : baseSepolia.id;

export { baseSepolia, anvil };

export const config = createConfig({
    chains: [baseSepolia, anvil],
    transports: {
        [baseSepolia.id]: http(),
        [anvil.id]: http("http://127.0.0.1:8545"),
    },
});
