import { formatEther } from "viem";

// Helper to convert serialized project to project type with proper BigInt values
export function deserializeProject(
    serializedProject: SerializedProject,
    projectId: number
): ProjectOnChain {
    return {
        projectId,
        tokenAddress: serializedProject[0] as `0x${string}`,
        owner: serializedProject[1] as `0x${string}`,
        goalAmount: Number(formatEther(BigInt(serializedProject[2]))),
        raisedAmount: Number(formatEther(BigInt(serializedProject[3]))),
        ownerWithdrawn: Number(formatEther(BigInt(serializedProject[4]))),
        startTime: Number(serializedProject[5]),
        endTime: Number(serializedProject[6]),
    };
}
// Project types for Fundl

export type SerializedProject = [
    tokenAddress: string,
    owner: string,
    goalAmount: string,
    raisedAmount: string,
    ownerWithdrawn: string,
    startTime: string,
    endTime: string
];

export type ProjectOnChain = {
    projectId: number;
    tokenAddress: `0x${string}`;
    owner: `0x${string}`;
    goalAmount: number;
    raisedAmount: number;
    ownerWithdrawn: number;
    startTime: number;
    endTime: number;
};

export type ProjectOnDb = {
    projectId: number;
    name: string;
    description?: string | null;
    imageUrl?: string | null;
};

export type Project = ProjectOnChain & ProjectOnDb;
