"use client";

import { useParams } from "next/navigation";
import useSWR from "swr";
import type { ProjectApiResponse } from "@/interfaces/projectApi";
import { Card } from "@/components/ui/card";
import { RequestRefundSection } from "./components/RequestRefundSection";
import { useUnifiedWallet } from "@/hooks/useUnifiedWallet";
import { Loader } from "@/components/Loader";
import { ErrorDialog } from "@/components/ErrorDialog";
import { FundProjectSection } from "./components/FundProjectSection";
import { OwnerControls } from "./components/OwnerControls";
import { ConnectWalletButton } from "@/components/ConnectWalletButtont";
import { fetcher } from "@/lib/utils";

export default function ProjectPage() {
    const { id } = useParams();
    const { address, isConnected } = useUnifiedWallet();
    const { data, error, isLoading, mutate } = useSWR<ProjectApiResponse>(
        id ? `${id}/api` : null,
        fetcher
    );
    const project = data?.project;
    const tokenSymbol = data?.tokenSymbol;

    // Ownership check
    const isOwner =
        address &&
        project?.owner &&
        address.toLowerCase() === project.owner.toLowerCase();

    if (isLoading) {
        return <Loader />;
    }

    if (error || !project) {
        return <ErrorDialog error={error?.message || "Project not found."} />;
    }

    // Calculate funding progress percentage
    const progressPercentage =
        project && project.raisedAmount > 0 && project.goalAmount > 0
            ? Math.min(
                  Number(
                      (
                          (project.raisedAmount * 100) /
                          project.goalAmount
                      ).toPrecision(4)
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
                                        {project.goalAmount} {tokenSymbol}
                                    </p>
                                </div>
                                <div>
                                    <p className="font-bold">Raised So Far:</p>
                                    <p className="font-bold">
                                        {project.raisedAmount} {tokenSymbol}
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
                                    {project.raisedAmount} /{" "}
                                    {project.goalAmount} {tokenSymbol}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Action Section */}
                <div className="space-y-6 md:col-span-2">
                    {isConnected ? (
                        isOwner ? (
                            <OwnerControls id={id as string} />
                        ) : (
                            <>
                                <FundProjectSection
                                    id={id as string}
                                    address={address}
                                    refetch={mutate}
                                />
                                <RequestRefundSection
                                    projectData={data}
                                    address={address}
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
