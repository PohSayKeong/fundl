"use client";

import { usePrivy } from "@privy-io/react-auth";
import { getChainId } from "@/lib/chainConfig";
import { encodeFunctionData, parseEther } from "viem";
import { useState } from "react";
import { FundlABI, FundlAddress, MockTokenAddress } from "@/lib/calls";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function CreateProject() {
    const { login, sendTransaction, user, ready } = usePrivy();
    const address = user?.wallet?.address || null;
    const isConnected = !!address && ready;
    const [tokenAddress, setTokenAddress] = useState(MockTokenAddress);
    const [projectName, setProjectName] = useState("");
    const [projectDescription, setProjectDescription] = useState("");
    const [projectImage, setProjectImage] = useState("");
    const [projectMilestones, setProjectMilestones] = useState("");
    const [goalTarget, setGoalTarget] = useState("");
    const [isCreating, setIsCreating] = useState(false);

    const handleCreateProject = async () => {
        if (!address || !sendTransaction) return;

        try {
            setIsCreating(true);
            const data = encodeFunctionData({
                abi: FundlABI,
                functionName: "createProject",
                args: [
                    address as `0x${string}`,
                    projectName || "",
                    projectDescription || "",
                    projectImage || "",
                    projectMilestones || "",
                    parseEther(goalTarget || "0"),
                ],
            });

            await sendTransaction({
                to: FundlAddress as `0x${string}`,
                value: BigInt(0),
                chainId: getChainId(),
                data: data,
            });

            // Reset form on success
            setProjectName("");
            setProjectDescription("");
            setProjectImage("");
            setProjectMilestones("");
            setGoalTarget("");
        } catch (err) {
            console.error("Error creating project:", err);
        } finally {
            setIsCreating(false);
        }
    };

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
                                    type="text"
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
                                    Project Description (Be Detailed!)
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
                                    htmlFor="imageLink"
                                    className="block text-xl font-bold text-foreground mb-2"
                                >
                                    Project Image Link
                                </Label>
                                <Input
                                    type="url"
                                    id="imageLink"
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
                                    htmlFor="Milestones"
                                    className="block text-xl font-bold text-foreground mb-2"
                                >
                                    Number of Milestones
                                </Label>
                                <Input
                                    id="projectMilestones"
                                    className="w-full px-4 py-2 border border-border rounded-lg"
                                    placeholder="Enter project milestones"
                                    value={projectMilestones}
                                    onChange={(e) =>
                                        setProjectMilestones(e.target.value)
                                    }
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <Label
                                    htmlFor="goal"
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
                                    htmlFor="Address"
                                    className="block text-xl font-bold text-foreground mb-2"
                                >
                                    Token Address (Optional)
                                </Label>
                                <Input
                                    type="text"
                                    id="Address"
                                    className="w-full px-4 py-2 border border-border rounded-lg"
                                    placeholder="Enter token address"
                                    value={tokenAddress}
                                    onChange={(e) =>
                                        setTokenAddress(e.target.value)
                                    }
                                    required
                                />
                            </div>

                            {isConnected ? (
                                <Button
                                    onClick={handleCreateProject}
                                    disabled={
                                        isCreating ||
                                        !projectName ||
                                        !goalTarget
                                    }
                                    className="w-full"
                                >
                                    {isCreating
                                        ? "Creating..."
                                        : "Create Project"}
                                </Button>
                            ) : (
                                <Button onClick={login} className="w-full">
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
