import { useUnifiedWallet } from "@/hooks/useUnifiedWallet";
import { FundlAddress, FundlABI } from "@/lib/calls";
import { getChainId } from "@/lib/chainConfig";
import { useEffect, useState } from "react";
import {
    encodeFunctionData,
    formatEther,
    createPublicClient,
    http,
} from "viem";
import { getChain } from "@/lib/chainConfig";
import { Button } from "@/components/ui/button";

interface OwnerControlsProps {
    id: string;
    refetch: () => Promise<void>;
}

export const OwnerControls = ({ id, refetch }: OwnerControlsProps) => {
    const [availableToCollect, setAvailableToCollect] = useState<string>("0");
    const [isTransactionLoading, setIsTransactionLoading] = useState(false);
    const { sendTransaction } = useUnifiedWallet();

    // Handle collect funds transaction
    const handleCollectFunds = async () => {
        try {
            setIsTransactionLoading(true);
            await sendTransaction({
                to: FundlAddress as `0x${string}`,
                value: BigInt(0),
                chainId: getChainId(),
                data: encodeFunctionData({
                    abi: FundlABI,
                    functionName: "collectFunding",
                    args: [BigInt(id as string)],
                }),
            });
            await refetch();
        } catch (err) {
            console.error("Error collecting funds:", err);
        } finally {
            setIsTransactionLoading(false);
        }
    };

    // Calculate available funds to collect (for owner only)
    useEffect(() => {
        async function calculateAvailableFunds() {
            try {
                const publicClient = createPublicClient({
                    chain: getChain(),
                    transport: http(),
                });
                const result = await publicClient.readContract({
                    address: FundlAddress as `0x${string}`,
                    abi: FundlABI,
                    functionName: "availableToOwner",
                    args: [BigInt(id as string)],
                });
                setAvailableToCollect(formatEther(result as bigint));
            } catch (err) {
                console.error("Error calculating available funds:", err);
                setAvailableToCollect("0");
            }
        }
        calculateAvailableFunds();
    }, [id]);

    return (
        <div className="bg-purple-50 border-4 border-black rounded-lg p-4 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            <h2 className="text-2xl font-extrabold mb-4">
                🧙‍♂️ Project Owner Controls
            </h2>
            <div className="space-y-4">
                {/* Owner controls: Available to collect section */}

                {/* Available to collect section */}
                <div className="p-4 bg-white border-4 border-black mt-6">
                    <p className="font-bold mb-1">Available to collect:</p>
                    <p className="text-3xl font-extrabold">
                        {availableToCollect} FMT
                    </p>
                </div>

                <Button
                    className="w-full"
                    disabled={
                        parseFloat(availableToCollect) <= 0 ||
                        isTransactionLoading
                    }
                    onClick={handleCollectFunds}
                >
                    {isTransactionLoading
                        ? "Processing..."
                        : "Collect Available Funds 💸"}
                </Button>

                {/* Info: How funding works */}
                <div className="border-4 border-black p-3 bg-yellow-50 mt-4">
                    <p className="font-bold text-sm">📝 How funding works:</p>
                    <ol className="list-decimal pl-4 text-sm mt-1">
                        <li>Funds stream to you over time</li>
                        <li>
                            The regular collect button lets you collect funds
                            that have accrued since your last collection
                        </li>
                    </ol>
                </div>
            </div>
        </div>
    );
};
