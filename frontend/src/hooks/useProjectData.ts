import { useState, useEffect, useMemo, useCallback } from "react";
import { getChain } from "@/lib/chainConfig";
import { createPublicClient, http } from "viem";
import { FundlABI, FundlAddress, MockTokenABI } from "@/lib/calls";
import type { Project, SerializedProject } from "@/types/projectTypes";
import { deserializeProject } from "@/types/projectTypes";

/**
 * Hook to fetch and manage a project's data from the Fundl contract.
 * @param id Project ID (string or number)
 * @param address (optional) Current user address for ownership check
 */
export function useProjectData(id: string, address?: string) {
    const [project, setProject] = useState<Project | null>(null);
    const [tokenSymbol, setTokenSymbol] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isOwner, setIsOwner] = useState(false);

    // Create a public client
    const publicClient = useMemo(
        () =>
            createPublicClient({
                chain: getChain(),
                transport: http(),
            }),
        []
    );

    const fetchProjectData = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await publicClient.readContract({
                address: FundlAddress as `0x${string}`,
                abi: FundlABI,
                functionName: "projects",
                args: [BigInt(id)],
            });
            const projectData = deserializeProject(data as SerializedProject);
            const tokenData = await publicClient.readContract({
                address: projectData.tokenAddress,
                abi: MockTokenABI,
                functionName: "symbol",
            });
            setProject(projectData);
            setTokenSymbol(tokenData as string);
            setIsOwner(
                !!address &&
                    address.toLowerCase() === projectData.owner.toLowerCase()
            );
            setIsLoading(false);
        } catch (err) {
            console.error("Error fetching project:", err);
            setError("Failed to load project data.");
            setIsLoading(false);
        }
    }, [id, address, publicClient]);

    useEffect(() => {
        fetchProjectData();
    }, [fetchProjectData]);

    return {
        project,
        tokenSymbol,
        isLoading,
        error,
        isOwner,
        refetch: fetchProjectData,
    };
}
