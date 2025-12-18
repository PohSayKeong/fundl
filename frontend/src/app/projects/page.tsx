"use client";

import useSWR from "swr";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ProjectCard } from "@/components/ProjectCard";
import { Project } from "@/types/projectTypes";
import { fetcher } from "@/lib/utils";

export default function ProjectsPage() {
    const [page, setPage] = useState(1);
    const projectsPerPage = 6;
    const { data, error, isLoading } = useSWR("/projects/api", fetcher);
    const projects: Array<Project | null> = data?.projects || [];
    const totalPages = Math.ceil((projects.length || 0) / projectsPerPage);
    const startIndex = (page - 1) * projectsPerPage;
    const displayedProjects = projects.slice(
        startIndex,
        startIndex + projectsPerPage
    );

    if (isLoading) {
        return (
            <div className="min-h-screen bg-bg flex flex-col items-center py-12 px-4">
                <Card className="w-full max-w-6xl p-8 mb-8">
                    <h1 className="text-4xl font-extrabold mb-8 text-center">
                        Projects 🚀
                    </h1>

                    <div className="grid gap-8 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((_, index) => (
                            <div
                                key={index}
                                className="rounded-lg border-4 border-black bg-white p-4 h-fit animate-pulse"
                            >
                                <div className="w-full h-64 bg-gray-300 mb-4 border-2 border-black rounded"></div>
                                <div className="h-8 bg-gray-300 w-3/4 mb-2 rounded"></div>
                                <div className="h-4 bg-gray-300 w-full mb-1 rounded"></div>
                                <div className="h-4 bg-gray-300 w-5/6 mb-1 rounded"></div>
                                <div className="h-4 bg-gray-300 w-4/6 mb-4 rounded"></div>
                                <div className="h-8 bg-gray-300 w-full mt-auto rounded"></div>
                            </div>
                        ))}
                    </div>
                </Card>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-bg flex flex-col items-center py-12 px-4">
                <Card className="w-full max-w-6xl p-8">
                    <h1 className="text-4xl font-extrabold mb-4 text-center">
                        Error 😕
                    </h1>
                    <p className="text-center text-red-600 font-bold">
                        {error}
                    </p>
                </Card>
            </div>
        );
    }

    if (!isLoading && projects.length === 0) {
        return (
            <div className="min-h-screen bg-bg flex flex-col items-center py-12 px-4">
                <Card className="w-full max-w-6xl p-8">
                    <h1 className="text-4xl font-extrabold mb-4 text-center">
                        Projects 🚀
                    </h1>
                    <p className="text-center font-bold">
                        No projects found. Be the first to create one!
                    </p>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-bg flex flex-col items-center py-12 px-4">
            <Card className="w-full max-w-6xl p-8 mb-8">
                <h1 className="text-4xl font-extrabold mb-8 text-center">
                    Projects 🚀
                </h1>

                <div className="grid gap-8 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                    {displayedProjects.map((project, index) =>
                        project ? (
                            <ProjectCard
                                key={startIndex + index}
                                project={project}
                                id={startIndex + index}
                            />
                        ) : (
                            <div
                                key={startIndex + index}
                                className="rounded-lg border-4 border-black bg-white p-4 h-80 flex items-center justify-center"
                            >
                                <p className="text-center">
                                    Loading project...
                                </p>
                            </div>
                        )
                    )}
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                    <div className="flex justify-center mt-12 gap-4">
                        <Button
                            onClick={() =>
                                setPage((prev) => Math.max(prev - 1, 1))
                            }
                            disabled={page === 1}
                            variant="neutral"
                        >
                            Previous
                        </Button>

                        <div className="flex items-center">
                            <span className="font-bold text-lg px-4 py-2 border-4 border-black bg-white">
                                {page} / {totalPages}
                            </span>
                        </div>

                        <Button
                            onClick={() =>
                                setPage((prev) =>
                                    Math.min(prev + 1, totalPages)
                                )
                            }
                            disabled={page === totalPages}
                            variant="neutral"
                        >
                            Next
                        </Button>
                    </div>
                )}
            </Card>
        </div>
    );
}
