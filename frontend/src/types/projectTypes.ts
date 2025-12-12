// Helper to convert serialized project to project type with proper BigInt values
export function deserializeProject(
    serializedProject: SerializedProject
): Project {
    return {
        tokenAddress: serializedProject[0] as `0x${string}`,
        owner: serializedProject[1] as `0x${string}`,
        name: "test", // TODO: fetch from api
        description: "test description",
        imageUrl: "https://i.imgur.com/uImH6Zf.jpeg",
        goalAmount: BigInt(serializedProject[2]),
        raisedAmount: BigInt(serializedProject[3]),
        ownerWithdrawn: BigInt(serializedProject[4]),
        startTime: BigInt(serializedProject[5]),
        endTime: BigInt(serializedProject[6]),
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

export type Project = {
    tokenAddress: `0x${string}`;
    owner: `0x${string}`;
    name: string;
    description: string;
    imageUrl: string;
    goalAmount: bigint;
    raisedAmount: bigint;
    ownerWithdrawn: bigint;
    startTime: bigint;
    endTime: bigint;
};
