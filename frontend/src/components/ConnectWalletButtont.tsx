import { Button } from "@/components/ui/button";
import { useUnifiedWallet } from "@/hooks/useUnifiedWallet";

export const ConnectWalletButton = () => {
    const { connect } = useUnifiedWallet();

    return (
        <div className="bg-blue-50 border-4 border-black rounded-lg p-4 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            <h2 className="text-2xl font-extrabold mb-4">
                🔌 Connect Your Wallet
            </h2>
            <p className="mb-4">
                Connect your wallet to fund this project or collect funds if
                you&#39;re the owner.
            </p>
            <Button onClick={connect}>Login with Privy</Button>
        </div>
    );
};
