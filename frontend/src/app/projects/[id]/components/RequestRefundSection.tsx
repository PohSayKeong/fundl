import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useProjectData } from "@/hooks/useProjectData";
import { useProjectRefund } from "@/hooks/useProjectRefund";
import { useUnifiedWallet } from "@/hooks/useUnifiedWallet";
import { FundlABI, FundlAddress } from "@/lib/calls";
import { getChainId } from "@/lib/chainConfig";
import { useState } from "react";
import { encodeFunctionData, formatEther } from "viem";

interface RequestRefundSectionProps {
    id: string;
    address?: string;
    refetch: () => Promise<void>;
}

export function RequestRefundSection({
    id,
    address,
    refetch,
}: RequestRefundSectionProps) {
    const [isTransactionLoading, setIsTransactionLoading] = useState(false);
    const { sendTransaction } = useUnifiedWallet();
    const { project, tokenSymbol } = useProjectData(id as string, address);
    const {
        refundRequestedByUser,
        userFundedAmount,
        totalRefundRequestedAmount,
        isLoading,
    } = useProjectRefund(id, address);

    // Handle request refund transaction
    const handleRequestRefund = async () => {
        try {
            setIsTransactionLoading(true);
            await sendTransaction({
                to: FundlAddress as `0x${string}`,
                value: BigInt(0),
                chainId: getChainId(),
                data: encodeFunctionData({
                    abi: FundlABI,
                    functionName: "createRefundRequest",
                    args: [BigInt(id as string)],
                }),
            });
            await refetch();
        } catch (err) {
            console.error("Error requesting refund:", err);
        } finally {
            setIsTransactionLoading(false);
        }
    };

    if (isLoading) {
        return <Spinner className="mx-auto" />;
    }

    if (!userFundedAmount) {
        return null;
    }

    return (
        <div className="bg-red-50 border-4 border-black rounded-lg p-4 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] mt-6">
            <h2 className="text-2xl font-extrabold mb-4">🔄 Request Refund</h2>
            <div className="space-y-4">
                {refundRequestedByUser ? (
                    <div className="p-4 bg-yellow-100 border-4 border-black">
                        <p className="font-bold">
                            ⚠️ You&apos;ve already requested a refund for this
                            project.
                        </p>
                        <p className="mt-2 text-sm">
                            If enough funders (50%) request refunds, you&apos;ll
                            be able to claim your funds back.
                        </p>
                        <p className="mt-2 text-sm">
                            {`Total refund requested so far: ${totalRefundRequestedAmount.toFixed(
                                2
                            )} ${tokenSymbol}`}
                        </p>
                        <p className="mt-2 text-sm">
                            {`You will receive: 
                            ${(
                                (userFundedAmount /
                                    totalRefundRequestedAmount) *
                                parseFloat(
                                    formatEther(
                                        project?.raisedAmount || BigInt(0)
                                    )
                                )
                            ).toFixed(2)} ${tokenSymbol}`}
                        </p>
                    </div>
                ) : (
                    <Button
                        className="w-full bg-red-100 hover:bg-red-200"
                        onClick={handleRequestRefund}
                        disabled={isTransactionLoading}
                    >
                        {isTransactionLoading
                            ? "Processing..."
                            : "Request Refund ⚠️"}
                    </Button>
                )}
                <div className="border-4 border-black p-3 bg-yellow-50 mt-4">
                    <p className="font-bold text-sm">📝 How refunds work:</p>
                    <ol className="list-decimal pl-4 text-sm mt-1">
                        <li>
                            You can request a refund if you&apos;ve funded this
                            project
                        </li>
                        <li>
                            If at least 50% of funders request refunds, all
                            funders can claim their funds back
                        </li>
                        <li>
                            This is a community protection mechanism if a
                            project is inactive or not delivering
                        </li>
                    </ol>
                </div>
            </div>
        </div>
    );
}
