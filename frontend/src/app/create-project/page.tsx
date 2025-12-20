"use client";

import { useIdentityToken } from "@privy-io/react-auth";
import { getChainId } from "@/lib/chainConfig";
import { encodeFunctionData, parseEther } from "viem";
import { useEffect, useState } from "react";
import { FundlABI, FundlAddress, MockTokenAddress } from "@/lib/calls";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useUnifiedWallet } from "@/hooks/useUnifiedWallet";

export default function CreateProject() {
    const {
        connect,
        sendTransaction,
        address,
        isConnected,
        txHash,
        isTransactionConfirmed,
        resetTransactionStatus,
    } = useUnifiedWallet();
    const { identityToken } = useIdentityToken();

    const [goalTarget, setGoalTarget] = useState("");
    const [endTime, setEndTime] = useState("");
    const [projectName, setProjectName] = useState("");
    const [projectDescription, setProjectDescription] = useState("");
    const [projectImage, setProjectImage] = useState("");
    const [isCreating, setIsCreating] = useState(false);

    const handleCreateProject = async (
        e: React.MouseEvent<HTMLButtonElement>
    ) => {
        e.preventDefault();
        if (!address || !sendTransaction) return;

        try {
            setIsCreating(true);
            const data = encodeFunctionData({
                abi: FundlABI,
                functionName: "createProject",
                args: [
                    MockTokenAddress,
                    parseEther(goalTarget || "0"),
                    endTime
                        ? Math.floor(new Date(endTime).getTime() / 1000)
                        : 0,
                ],
            });

            await sendTransaction({
                to: FundlAddress as `0x${string}`,
                value: BigInt(0),
                chainId: getChainId(),
                data: data,
            });
        } catch (err) {
            console.error("Error creating project:", err);
        }
    };

    useEffect(() => {
        const submitProjectMetadata = async () => {
            if (isTransactionConfirmed) {
                // Send metadata to server
                await fetch("/projects/api", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "privy-id-token": identityToken || "",
                    },
                    body: JSON.stringify({
                        name: projectName,
                        description: projectDescription,
                        image: projectImage,
                        txHash,
                    }),
                });

                // Reset form on success
                setGoalTarget("");
                setEndTime("");
                setProjectName("");
                setProjectDescription("");
                setProjectImage("");
                resetTransactionStatus();
                setIsCreating(false);
            }
        };
        submitProjectMetadata();
    }, [
        identityToken,
        isTransactionConfirmed,
        projectDescription,
        projectImage,
        projectName,
        resetTransactionStatus,
        txHash,
    ]);

    return (
        <div className="relative min-h-screen bg-bg p-6">
            {/* Hero Section */}
            <Card className="max-w-4xl w-full mx-auto my-8">
                <div className="relative h-full flex items-center justify-center text-center">
                    <div className="max-w-4xl px-4">
                        <h1 className="mb-8 text-4xl font-extrabold text-center">
                            Create a Project 🚀
                        </h1>
                    </div>
                </div>
                <section>
                    <div className="container mx-auto px-4 max-w-xl bg-blue-50 border-4 border-black rounded-lg p-4">
                        <form className="space-y-6">
                            <div className="form-group">
                                <Label
                                    htmlFor="projectName"
                                    className="block text-xl font-bold text-foreground mb-2"
                                >
                                    Project Name
                                </Label>
                                <Input
                                    id="projectName"
                                    className="w-full px-4 py-2 border border-border rounded-lg"
                                    placeholder="Enter project name"
                                    value={projectName}
                                    onChange={(e) =>
                                        setProjectName(e.target.value)
                                    }
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <Label
                                    htmlFor="projectDescription"
                                    className="block text-xl font-bold text-foreground mb-2"
                                >
                                    Project Description
                                </Label>
                                <textarea
                                    id="projectDescription"
                                    className="w-full px-4 py-2 border border-border rounded-lg"
                                    placeholder="Describe the project"
                                    rows={4}
                                    value={projectDescription}
                                    onChange={(e) =>
                                        setProjectDescription(e.target.value)
                                    }
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <Label
                                    htmlFor="projectImage"
                                    className="block text-xl font-bold text-foreground mb-2"
                                >
                                    Project Image Link
                                </Label>
                                <Input
                                    type="url"
                                    id="projectImage"
                                    className="w-full px-4 py-2 border border-border rounded-lg"
                                    placeholder="Enter image URL"
                                    value={projectImage}
                                    onChange={(e) =>
                                        setProjectImage(e.target.value)
                                    }
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <Label
                                    htmlFor="goalTarget"
                                    className="block text-xl font-bold text-foreground mb-2"
                                >
                                    Goal Amount
                                </Label>
                                <Input
                                    id="goalTarget"
                                    className="w-full px-4 py-2 border border-border rounded-lg"
                                    placeholder="Enter goal target"
                                    value={goalTarget}
                                    onChange={(e) =>
                                        setGoalTarget(e.target.value)
                                    }
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <Label
                                    htmlFor="endTime"
                                    className="block text-xl font-bold text-foreground mb-2"
                                >
                                    End Time
                                </Label>
                                <Input
                                    type="datetime-local"
                                    id="endTime"
                                    className="w-full px-4 py-2 border border-border rounded-lg"
                                    placeholder="Select end time"
                                    value={endTime}
                                    onChange={(e) => setEndTime(e.target.value)}
                                    required
                                />
                            </div>

                            {isConnected ? (
                                <Button
                                    onClick={(e) => handleCreateProject(e)}
                                    disabled={
                                        isCreating ||
                                        !goalTarget ||
                                        !endTime ||
                                        !projectName ||
                                        !projectDescription ||
                                        !projectImage
                                    }
                                    className="w-full"
                                >
                                    {isCreating
                                        ? "Creating..."
                                        : "Create Project"}
                                </Button>
                            ) : (
                                <Button onClick={connect} className="w-full">
                                    Login with Privy to Create Project
                                </Button>
                            )}
                        </form>
                    </div>
                </section>
            </Card>

            {/* Form Section */}
        </div>
    );
}
