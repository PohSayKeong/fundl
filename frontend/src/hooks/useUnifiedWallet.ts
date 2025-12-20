import {
    usePrivy,
    useWallets,
    useSendTransaction as usePrivySendTransaction,
    UnsignedTransactionRequest,
} from "@privy-io/react-auth";
import { useState } from "react";
import {
    useAccount,
    useConnect,
    useDisconnect,
    useSendTransaction,
    useWaitForTransactionReceipt,
} from "wagmi";
const isProd = process.env.NODE_ENV === "production";

/**
 * Unified wallet hook: abstracts Privy and wagmi, exposing only generic wallet actions and state.
 * Consumers do not need to know which provider is used.
 */
export function useUnifiedWallet() {
    const privy = usePrivy();
    const privyWallets = useWallets();
    // const privySessionSigners = useSessionSigners();
    const { sendTransaction: privySendTransaction } = usePrivySendTransaction();

    const wagmiAccount = useAccount();
    const wagmiConnect = useConnect();
    const wagmiDisconnect = useDisconnect();
    const wagmiSendTransaction = useSendTransaction();

    const [hash, setHash] = useState<`0x${string}`>();
    const { isSuccess } = useWaitForTransactionReceipt({ hash });

    // Privy values
    const privyAddress =
        privyWallets.wallets && privyWallets.wallets.length > 0
            ? privyWallets.wallets[0].address
            : undefined;
    const privyIsConnected = !!privyAddress && privy.ready;

    // wagmi values
    const wagmiAddress = wagmiAccount.address;
    const wagmiIsConnected = !!wagmiAddress && wagmiAccount.isConnected;

    // Unified values
    const address = isProd ? privyAddress : wagmiAddress;
    const isConnected = isProd ? privyIsConnected : wagmiIsConnected;

    // Unified connect
    const connect = async () => {
        if (isProd) {
            if (!privyIsConnected) {
                await privy.login();
            }
        } else {
            if (!wagmiIsConnected && wagmiConnect.connectors.length > 0) {
                await wagmiConnect.connectAsync({
                    connector: wagmiConnect.connectors[0],
                });
            }
        }
    };

    // Unified disconnect
    const disconnect = async () => {
        if (isProd) {
            if (privyWallets.wallets?.length) privy.logout();
        } else {
            if (wagmiAccount.isConnected) wagmiDisconnect.disconnect();
        }
    };

    // Unified sendTransaction
    const sendTransaction = async (
        tx: Parameters<typeof wagmiSendTransaction.sendTransactionAsync>[0]
    ) => {
        if (isProd) {
            const sentTx = await privySendTransaction(
                tx as UnsignedTransactionRequest
            );
            setHash(sentTx.hash);
        } else {
            if (wagmiAccount.isConnected) {
                const txHash = await wagmiSendTransaction.sendTransactionAsync(
                    tx!
                );
                setHash(txHash);
            } else {
                throw new Error("No connected wallet for sending transaction");
            }
        }
    };

    // Required for server signed transactions with Privy embedded wallet
    // useEffect(() => {
    //     if (isProd && privy.user && address) {
    //         const walletsWithSessionSigners = privy.user.linkedAccounts.filter(
    //             (account) =>
    //                 account.type === "wallet" &&
    //                 "id" in account &&
    //                 account.delegated
    //         );
    //         if (walletsWithSessionSigners.length === 0) {
    //             privySessionSigners.addSessionSigners({
    //                 address,
    //                 signers: [
    //                     { signerId: process.env.NEXT_PUBLIC_PRIVY_SIGNER_ID! },
    //                 ],
    //             });
    //         }
    //     }
    // }, [address, privy.user, privySessionSigners]);

    return {
        address,
        isConnected,
        connect,
        disconnect,
        sendTransaction,
        isTransactionConfirmed: isSuccess,
        txHash: hash,
        resetTransactionStatus: () => setHash(undefined),
    };
}
