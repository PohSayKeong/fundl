import { NextResponse } from "next/server";
import { createPublicClient, http } from "viem";
import { FundlABI, FundlAddress } from "@/lib/calls";
import { getChain } from "@/lib/chainConfig";
import prisma from "@/lib/prisma";
import { deserializeProject, SerializedProject } from "@/types/projectTypes";
import { combineProjectData } from "@/lib/utils";

// GET all projects
export async function GET() {
    try {
        const publicClient = createPublicClient({
            chain: getChain(),
            transport: http(),
        });
        const count = await publicClient.readContract({
            address: FundlAddress as `0x${string}`,
            abi: FundlABI,
            functionName: "projectIdCounter",
        });
        const projectCount = Number(count) || 5;
        const projectsOnChain = await Promise.all(
            Array.from({ length: projectCount }, async (_, i) => {
                const serializedProject = await publicClient.readContract({
                    address: FundlAddress as `0x${string}`,
                    abi: FundlABI,
                    functionName: "projects",
                    args: [BigInt(i)],
                });
                return deserializeProject(
                    serializedProject as SerializedProject,
                    i
                );
            })
        );
        const projectsFromDb = await prisma.project.findMany();
        const projects = projectsOnChain.map((projectOnChain) => {
            if (!projectOnChain) return null;
            const projectFromDb = projectsFromDb.find(
                (p) => Number(p.projectId) === projectOnChain.projectId
            );
            return combineProjectData(projectOnChain, projectFromDb);
        });
        return NextResponse.json({ projects });
    } catch (error) {
        const errorMessage =
            error instanceof Error ? error.message : String(error);
        return NextResponse.json(
            { error: `Failed to fetch projects. ${errorMessage}` },
            { status: 500 }
        );
    }
}
