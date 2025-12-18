import { Project, ProjectOnChain, ProjectOnDb } from "@/types/projectTypes";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function combineProjectData(
    onChain: ProjectOnChain,
    onDb?: ProjectOnDb | null
): Project {
    return {
        ...onChain,
        name: onDb?.name || "Unnamed Project",
        description: onDb?.description,
        imageUrl: onDb?.imageUrl,
    };
}

export function fetcher(url: string) {
    return fetch(url).then((res) => res.json());
}
