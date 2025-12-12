// Central chain config for frontend
import { baseSepolia, anvil } from "viem/chains";

export const getChain = () =>
    process.env.NODE_ENV === "development" ? anvil : baseSepolia;

export const getChainId = () =>
    process.env.NODE_ENV === "development" ? anvil.id : baseSepolia.id;

export { baseSepolia, anvil };
