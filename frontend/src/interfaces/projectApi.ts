import type { Project } from "@/types/projectTypes";

export interface ProjectApiResponse {
    project: Project | null;
    tokenSymbol: string | null;
}
