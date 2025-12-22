import { NextRequest, NextResponse } from "next/server";
import { createPublicClient, http } from "viem";
import { FundlABI, FundlAddress, MockTokenABI } from "@/lib/calls";
import { getChain } from "@/lib/chainConfig";
import prisma from "@/lib/prisma";
import { deserializeProject, SerializedProject } from "@/types/projectTypes";
import { combineProjectData } from "@/lib/utils";

export async function GET(req: NextRequest) {
    try {
        // Extract id from the URL path: /projects/[id]/api
        const url = new URL(req.url);
        const parts = url.pathname.split("/");
        // Find the index of 'projects' and get the next part as id
        const projectsIdx = parts.findIndex((p) => p === "projects");
        const id =
            projectsIdx !== -1 && parts.length > projectsIdx + 1
                ? parts[projectsIdx + 1]
                : null;
        if (!id || isNaN(Number(id))) {
            return NextResponse.json(
                { error: "Invalid project id." },
                { status: 400 }
            );
        }
        const publicClient = createPublicClient({
            chain: getChain(),
            transport: http(),
        });
        let projectOnChain = null;

        const serializedProject = await publicClient.readContract({
            address: FundlAddress as `0x${string}`,
            abi: FundlABI,
            functionName: "projects",
            args: [BigInt(id)],
        });
        projectOnChain = deserializeProject(
            serializedProject as SerializedProject,
            Number(id)
        );

        const projectFromDb = await prisma.project.findUnique({
            where: { projectId: Number(id) },
        });
        if (!projectOnChain && !projectFromDb) {
            return NextResponse.json(
                { error: "Project not found." },
                { status: 404 }
            );
        }
        const project = combineProjectData(projectOnChain, projectFromDb);
        let tokenSymbol = null;
        if (project?.tokenAddress) {
            try {
                tokenSymbol = await publicClient.readContract({
                    address: project.tokenAddress,
                    abi: MockTokenABI,
                    functionName: "symbol",
                });
            } catch {}
        }
        return NextResponse.json({ project, tokenSymbol });
    } catch (error) {
        const errorMessage =
            error instanceof Error ? error.message : String(error);
        return NextResponse.json(
            { error: `Failed to fetch project. ${errorMessage}` },
            { status: 500 }
        );
    }
}

export async function POST(req: NextRequest) {
    try {
        const url = new URL(req.url);
        const parts = url.pathname.split("/");
        const projectsIdx = parts.findIndex((p) => p === "projects");
        const id =
            projectsIdx !== -1 && parts.length > projectsIdx + 1
                ? parts[projectsIdx + 1]
                : null;

        if (!id || isNaN(Number(id))) {
            return NextResponse.json(
                { error: "Invalid project id." },
                { status: 400 }
            );
        }

        const projectExists = await prisma.project.findUnique({
            where: { projectId: Number(id) },
        });

        if (!projectExists) {
            return NextResponse.json(
                { error: "Project not found." },
                { status: 404 }
            );
        }

        const body = await req.json();
        const { name, description, imageUrl } = body;

        if (!name || !description || !imageUrl) {
            return NextResponse.json(
                { error: "Missing required fields." },
                { status: 400 }
            );
        }

        const updatedProject = await prisma.project.update({
            where: { projectId: Number(id) },
            data: {
                name,
                description,
                imageUrl,
            },
        });

        return NextResponse.json({
            message: "Project updated successfully.",
            updatedProject,
        });
    } catch (error) {
        const errorMessage =
            error instanceof Error ? error.message : String(error);
        return NextResponse.json(
            { error: `Failed to update project. ${errorMessage}` },
            { status: 500 }
        );
    }
}
