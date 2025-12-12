"use client";

import { useParams } from "next/navigation";
import { Card } from "@/components/ui/card";
import { RequestRefundSection } from "./components/RequestRefundSection";
import { useUnifiedWallet } from "@/hooks/useUnifiedWallet";
import { useProjectData } from "@/hooks/useProjectData";
import { Loader } from "@/components/Loader";
import { ErrorDialog } from "@/components/ErrorDialog";
import { FundProjectSection } from "./components/FundProjectSection";
import { formatEther } from "viem";
import { OwnerControls } from "./components/OwnerControls";
import { ConnectWalletButton } from "@/components/ConnectWalletButtont";

export default function ProjectPage() {
    const { id } = useParams();
    const { address, isConnected } = useUnifiedWallet();
    const { project, tokenSymbol, isLoading, error, isOwner, refetch } =
        useProjectData(id as string, address);

    if (isLoading) {
        return <Loader />;
    }

    if (error || !project) {
        return <ErrorDialog error={error || "Project not found."} />;
    }

    // Calculate funding progress percentage
    const progressPercentage =
        project &&
        project.raisedAmount > BigInt(0) &&
        project.goalAmount > BigInt(0)
            ? Math.min(
                  Number(
                      (project.raisedAmount * BigInt(100)) / project.goalAmount
                  ),
                  100
              )
            : 0;

    return (
        <div className="min-h-screen bg-bg p-6">
            <Card className="max-w-4xl w-full mx-auto my-8 grid md:grid-cols-2 gap-8">
                {/* Project Image */}
                {project.imageUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                        src={project.imageUrl}
                        alt={project.name}
                        className="object-contain my-auto"
                    />
                )}

                {/* Project Details */}
                <div>
                    <h1 className="text-4xl font-extrabold">{project.name}</h1>
                    <p className="mb-4">
                        Created by:{" "}
                        <span className="font-bold">
                            {project.owner.substring(0, 6)}...
                            {project.owner.substring(38)}
                        </span>
                    </p>
                    <div className="space-y-6">
                        <div>
                            <h2 className="text-2xl font-extrabold mb-2">
                                About This Project
                            </h2>
                            <div className="bg-yellow-50 border-4 border-black p-4 rounded-lg">
                                <p className="whitespace-pre-wrap">
                                    {project.description}
                                </p>
                            </div>
                        </div>

                        <div>
                            <h2 className="text-2xl font-extrabold mb-2">
                                Project Status
                            </h2>
                            <div className="grid grid-cols-2 gap-4 p-4 bg-blue-50 border-4 border-black rounded-lg">
                                <div>
                                    <p className="font-bold">Goal Amount:</p>
                                    <p className="font-bold">
                                        {formatEther(project.goalAmount)}{" "}
                                        {tokenSymbol}
                                    </p>
                                </div>
                                <div>
                                    <p className="font-bold">Raised So Far:</p>
                                    <p className="font-bold">
                                        {formatEther(project.raisedAmount)}{" "}
                                        {tokenSymbol}
                                    </p>
                                </div>
                            </div>

                            {/* Progress Bar */}
                            <div className="mt-4 mb-2 font-bold">
                                Funding Progress: {progressPercentage}%
                            </div>
                            <div className="h-8 w-full border-4 border-black bg-white relative">
                                <div
                                    className="absolute top-0 left-0 h-full bg-green-500"
                                    style={{ width: `${progressPercentage}%` }}
                                ></div>
                                <div className="absolute inset-0 flex items-center justify-center font-extrabold text-black">
                                    {formatEther(project.raisedAmount)} /{" "}
                                    {formatEther(project.goalAmount)}{" "}
                                    {tokenSymbol}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Action Section */}
                <div className="space-y-6 md:col-span-2">
                    {isConnected ? (
                        isOwner ? (
                            <OwnerControls
                                id={id as string}
                                refetch={refetch}
                            />
                        ) : (
                            <>
                                <FundProjectSection
                                    id={id as string}
                                    address={address}
                                    refetch={refetch}
                                />
                                <RequestRefundSection
                                    id={id as string}
                                    address={address}
                                    refetch={refetch}
                                />
                            </>
                        )
                    ) : (
                        <ConnectWalletButton />
                    )}
                </div>
            </Card>
        </div>
    );
}
