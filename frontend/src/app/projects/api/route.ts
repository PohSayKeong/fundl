import { NextResponse } from "next/server";
import { createPublicClient, http, parseEventLogs } from "viem";
import { FundlABI, FundlAddress } from "@/lib/calls";
import { getChain } from "@/lib/chainConfig";
import prisma from "@/lib/prisma";
import { deserializeProject, SerializedProject } from "@/types/projectTypes";
import { combineProjectData } from "@/lib/utils";
import { doesUserOwnAddress, getUserFromPrivy } from "@/lib/privy";
import { Event } from "ethers";

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

// POST: Create project metadata after tx confirmation
export async function POST(req: Request) {
    try {
        const idToken = req.headers.get("privy-id-token");
        if (!idToken) {
            return NextResponse.json(
                { error: "Missing Privy identity token." },
                { status: 401 }
            );
        }

        // Verify Privy identity token
        const privyUser = await getUserFromPrivy(idToken);
        if (!privyUser) {
            return NextResponse.json(
                { error: "Invalid Privy identity token." },
                { status: 401 }
            );
        }

        const body = await req.json();
        const { name, description, image, txHash } = body;
        if (!name || !description || !image || !txHash) {
            return NextResponse.json(
                { error: "Missing required fields." },
                { status: 400 }
            );
        }

        // Fetch the transaction from the chain
        const publicClient = createPublicClient({
            chain: getChain(),
            transport: http(),
        });

        // Get the transaction receipt to parse logs
        const receipt = await publicClient.getTransactionReceipt({
            hash: txHash,
        });

        const projectCreatedLog = parseEventLogs({
            abi: FundlABI,
            logs: receipt.logs,
            eventName: "ProjectCreated",
        })[0] as unknown as Event;

        const projectOwner = projectCreatedLog.args?.owner;

        if (!doesUserOwnAddress(privyUser, projectOwner)) {
            return NextResponse.json(
                { error: "User does not own the project owner address." },
                { status: 403 }
            );
        }

        const project = await prisma.project.create({
            data: {
                projectId: Number(projectCreatedLog.args?.projectId),
                name,
                description,
                imageUrl: image,
                owner: projectOwner,
            },
        });

        return NextResponse.json({ success: true, project });
    } catch (error) {
        return NextResponse.json(
            { error: error instanceof Error ? error.message : String(error) },
            { status: 500 }
        );
    }
}
