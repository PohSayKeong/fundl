import { useUnifiedWallet } from "@/hooks/useUnifiedWallet";
import { FundlAddress, FundlABI } from "@/lib/calls";
import { getChainId } from "@/lib/chainConfig";
import { useCallback, useEffect, useState } from "react";
import {
    encodeFunctionData,
    formatEther,
    createPublicClient,
    http,
} from "viem";
import { getChain } from "@/lib/chainConfig";
import { Button } from "@/components/ui/button";
import { EditProjectDialog } from "./EditProjectDialog";
import { KeyedMutator } from "swr";
import { ProjectApiResponse } from "@/interfaces/projectApi";
import { useIdentityToken } from "@privy-io/react-auth";

interface OwnerControlsProps {
    id: string;
    refetch: KeyedMutator<ProjectApiResponse>;
}

export const OwnerControls = ({ id, refetch }: OwnerControlsProps) => {
    const [availableToCollect, setAvailableToCollect] = useState<string>("0");
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const {
        sendTransaction,
        isTransactionConfirmed,
        resetTransactionStatus,
        txHash,
    } = useUnifiedWallet();
    const { identityToken } = useIdentityToken();

    const calculateAvailableFunds = useCallback(async () => {
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
    }, [id]);

    // Handle collect funds transaction
    const handleCollectFunds = async () => {
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
    };

    // Calculate available funds to collect (for owner only)
    useEffect(() => {
        if (isTransactionConfirmed) {
            resetTransactionStatus();
        }
        calculateAvailableFunds();
    }, [
        calculateAvailableFunds,
        isTransactionConfirmed,
        resetTransactionStatus,
    ]);

    const handleEditSubmit = async (formData: {
        name: string;
        description: string;
        imageUrl: string;
    }) => {
        try {
            const response = await fetch(`/projects/${id}/api`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "privy-id-token": identityToken || "",
                },
                body: JSON.stringify(formData),
            });

            if (!response.ok) {
                throw new Error("Failed to update project");
            }

            await refetch();
        } catch (error) {
            console.error("Error updating project:", error);
        }
    };

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

            <Button
                className="w-full mt-4"
                disabled={parseFloat(availableToCollect) <= 0 || !!txHash}
                onClick={handleCollectFunds}
            >
                {txHash ? "Processing..." : "Collect Available Funds 💸"}
            </Button>

            <Button
                className="w-full mt-4"
                onClick={() => setIsDialogOpen(true)}
            >
                Edit Project Info
            </Button>

            <EditProjectDialog
                isOpen={isDialogOpen}
                onOpenChange={setIsDialogOpen}
                onSubmit={handleEditSubmit}
            />
        </div>
    );
};
