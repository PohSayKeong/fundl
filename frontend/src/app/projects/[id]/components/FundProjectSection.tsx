import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    FundlABI,
    FundlAddress,
    MockTokenABI,
    MockTokenAddress,
} from "@/lib/calls";
import { getChainId } from "@/lib/chainConfig";
import { useUnifiedWallet } from "@/hooks/useUnifiedWallet";
import { encodeFunctionData, parseEther } from "viem";
import { useState } from "react";
import { useProjectRefund } from "@/hooks/useProjectRefund";

interface FundProjectSectionProps {
    id: string;
    address?: string;
    refetch: () => Promise<void>;
}

export function FundProjectSection({
    id,
    address,
    refetch,
}: FundProjectSectionProps) {
    const [fundAmount, setFundAmount] = useState("");
    const [isTransactionLoading, setIsTransactionLoading] = useState(false);
    const { refundRequestedByUser } = useProjectRefund(id, address);
    const { sendTransaction } = useUnifiedWallet();

    const fundProjectCall =
        address && fundAmount
            ? [
                  // First approve tokens
                  {
                      to: MockTokenAddress as `0x${string}`,
                      data: encodeFunctionData({
                          abi: MockTokenABI,
                          functionName: "approve",
                          args: [
                              FundlAddress as `0x${string}`,
                              parseEther(fundAmount || "0"),
                          ],
                      }),
                      chainId: getChainId(),
                  },
                  // Then fund the project
                  {
                      to: FundlAddress as `0x${string}`,
                      data: encodeFunctionData({
                          abi: FundlABI,
                          functionName: "fundl",
                          args: [
                              BigInt(id as string),
                              parseEther(fundAmount || "0"),
                          ],
                      }),
                      chainId: getChainId(),
                  },
              ]
            : [];

    // Handle fund project transaction
    const handleFundProject = async () => {
        if (!sendTransaction || fundProjectCall.length === 0) return;

        try {
            setIsTransactionLoading(true);
            await sendTransaction({
                to: FundlAddress as `0x${string}`,
                value: BigInt(0),
                chainId: getChainId(),
                data: fundProjectCall[1].data,
            });
            setFundAmount("");
            await refetch();
        } catch (err) {
            console.error("Error funding project:", err);
        } finally {
            setIsTransactionLoading(false);
        }
    };

    if (refundRequestedByUser) {
        return null;
    }

    return (
        <div className="bg-green-50 border-4 border-black rounded-lg p-4 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            <h2 className="text-2xl font-extrabold mb-4">
                🚀 Support This Project
            </h2>
            <div className="space-y-4">
                <div>
                    <Label
                        htmlFor="fundAmount"
                        className="block font-bold mb-2"
                    >
                        Amount to Fund (FMT)
                    </Label>
                    <Input
                        id="fundAmount"
                        type="number"
                        step="0.01"
                        min="0"
                        className="w-full"
                        placeholder="0.0"
                        value={fundAmount}
                        onChange={(e) => setFundAmount(e.target.value)}
                    />
                </div>
                <Button
                    className="w-full"
                    onClick={handleFundProject}
                    disabled={isTransactionLoading || !fundAmount}
                >
                    {isTransactionLoading ? "Processing..." : "Fund Project 💰"}
                </Button>
                <div className="border-4 border-black p-3 bg-yellow-50 mt-4">
                    <p className="font-bold text-sm">📝 How funding works:</p>
                    <ol className="list-decimal pl-4 text-sm mt-1">
                        <li>Approve tokens to be spent by the contract</li>
                        <li>Fund the project with your approved tokens</li>
                        <li>The project owner can collect funds over time</li>
                    </ol>
                </div>
            </div>
        </div>
    );
}
