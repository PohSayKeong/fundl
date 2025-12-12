import { usePrivy, useWallets } from "@privy-io/react-auth";
import {
    useAccount,
    useConnect,
    useDisconnect,
    useSignMessage,
    useSendTransaction,
} from "wagmi";
import { useMemo } from "react";

/**
 * Unified wallet hook: abstracts Privy and wagmi, exposing only generic wallet actions and state.
 * Consumers do not need to know which provider is used.
 */
export function useUnifiedWallet() {
    // Privy
    const {
        login: privyLogin,
        logout: privyLogout,
        ready,
        authenticated,
    } = usePrivy();
    const { wallets } = useWallets();

    // wagmi
    const wagmiAccount = useAccount();
    const wagmiConnect = useConnect();
    const wagmiDisconnect = useDisconnect();
    const wagmiSignMessage = useSignMessage();
    const wagmiSendTransaction = useSendTransaction();

    // Unified address: prefer Privy, fallback to wagmi
    const address = useMemo(() => {
        if (wallets && wallets.length > 0 && wallets[0].address) {
            return wallets[0].address;
        }
        if (wagmiAccount.address) {
            return wagmiAccount.address;
        }
    }, [wallets, wagmiAccount.address]);

    // Unified connection status
    const isConnected = !!address && (ready || wagmiAccount.isConnected);

    // Unified connect
    const connect = async () => {
        if (!isConnected) {
            // Try Privy login first
            await privyLogin();
            // If still not connected, try wagmi
            if (!wallets?.length && wagmiConnect.connectors.length > 0) {
                await wagmiConnect.connectAsync({
                    connector: wagmiConnect.connectors[0],
                });
            }
        }
    };

    // Unified disconnect
    const disconnect = async () => {
        if (wallets?.length) privyLogout();
        if (wagmiAccount.isConnected) wagmiDisconnect.disconnect();
    };

    // Unified send transaction
    const sendTransaction = async (
        tx: Parameters<typeof wagmiSendTransaction.sendTransactionAsync>[0]
    ) => {
        if (wagmiAccount.isConnected) {
            return wagmiSendTransaction.sendTransactionAsync(tx);
        }
        throw new Error("No connected wallet for sending transaction");
    };

    // Unified sign message
    const signMessage = async (
        msg: Parameters<typeof wagmiSignMessage.signMessageAsync>[0]
    ) => {
        if (wagmiAccount.isConnected) {
            return wagmiSignMessage.signMessageAsync(msg);
        }
        throw new Error("No connected wallet for signing message");
    };

    return {
        address,
        isConnected,
        connect,
        disconnect,
        sendTransaction,
        signMessage,
        authenticated, // for Privy session state if needed
    };
}
