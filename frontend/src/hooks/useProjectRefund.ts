import { useState, useEffect } from "react";
import { createPublicClient, formatEther, http } from "viem";
import { FundlABI, FundlAddress } from "@/lib/calls";
import { getChain } from "@/lib/chainConfig";

/**
 * Hook to fetch refund request status and total refund requested amount for a project.
 * @param projectId Project ID (string or number)
 * @param userAddress (optional) User address to check their refund request status
 */
export function useProjectRefund(
    projectId: string | number | undefined,
    userAddress?: string | null
) {
    const [refundRequestedByUser, setRefundRequestedByUser] =
        useState<boolean>(false);
    const [totalRefundRequestedAmount, setTotalRefundRequestedAmount] =
        useState<number>(0);
    const [userFundedAmount, setUserFundedAmount] = useState<number>(0);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!projectId) return;
        setIsLoading(true);
        const publicClient = createPublicClient({
            chain: getChain(),
            transport: http(),
        });

        async function fetchRefundData() {
            try {
                // refundRequestByUsersByProject(projectId, userAddress) => bool
                let userRequested = false;
                let userRequestedAmount = "0";
                if (userAddress) {
                    userRequested = (await publicClient.readContract({
                        address: FundlAddress as `0x${string}`,
                        abi: FundlABI,
                        functionName: "refundRequestByUsersByProject",
                        args: [BigInt(projectId as string), userAddress],
                    })) as boolean;
                    userRequestedAmount = formatEther(
                        (await publicClient.readContract({
                            address: FundlAddress as `0x${string}`,
                            abi: FundlABI,
                            functionName: "fundingByUsersByProject",
                            args: [BigInt(projectId as string), userAddress],
                        })) as bigint
                    );
                }
                // totalRefundRequestedAmount(projectId) => uint256
                const totalRequested = (await publicClient.readContract({
                    address: FundlAddress as `0x${string}`,
                    abi: FundlABI,
                    functionName: "totalRefundRequestedAmount",
                    args: [BigInt(projectId as string)],
                })) as bigint;
                setRefundRequestedByUser(!!userRequested);
                setTotalRefundRequestedAmount(
                    parseFloat(formatEther(totalRequested))
                );
                setUserFundedAmount(parseFloat(userRequestedAmount));
                setIsLoading(false);
            } catch (err) {
                console.error("Error fetching refund data:", err);
                setError("Failed to fetch refund data");
                setIsLoading(false);
            }
        }
        fetchRefundData();
    }, [projectId, userAddress]);

    return {
        refundRequestedByUser,
        totalRefundRequestedAmount,
        userFundedAmount,
        isLoading,
        error,
    };
}
