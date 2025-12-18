"use client";

import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { Project } from "@/lib/projectTypes";

export const ProjectCard = ({
    project,
    id,
}: {
    project: Project;
    id: number;
}) => {
    // Calculate funding progress percentage
    const progressPercentage =
        project.raisedAmount > 0 && project.goalAmount > 0
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
        <div className="w-full">
            <Card className="h-full flex flex-col overflow-hidden transition-transform hover:-translate-y-1">
                {/* Project Image */}
                <div className="relative w-full pt-[100%] border border-black bg-blue-100 overflow-hidden rounded">
                    {project.imageUrl ? (
                        <img
                            src={project.imageUrl}
                            alt={project.name}
                            className="absolute inset-0 w-full h-full object-cover"
                        />
                    ) : (
                        <div className="absolute inset-0 flex items-center justify-center bg-blue-200 text-black font-bold text-2xl">
                            No Image
                        </div>
                    )}
                </div>

                {/* Project Info */}
                <div className="flex flex-col flex-grow p-4">
                    <h2 className="text-2xl font-extrabold mb-2 truncate">
                        {project.name}
                    </h2>

                    <p className="text-sm line-clamp-3 mb-4">
                        {project.description}
                    </p>

                    {/* Project Owner */}
                    <div className="mb-2 text-sm">
                        <span className="font-bold">Owner: </span>
                        <span className="inline-block bg-black text-white px-2 py-1 rounded truncate w-full">
                            {project.owner}
                        </span>
                    </div>

                    {/* Funding Progress */}
                    <div className="mb-4">
                        <div className="flex justify-between text-sm mb-1">
                            <span className="font-bold">
                                Progress: {progressPercentage}%
                            </span>
                            <span>
                                {project.raisedAmount} / {project.goalAmount}{" "}
                                FMT
                            </span>
                        </div>
                        <div className="h-6 w-full border-4 border-black bg-white relative">
                            <div
                                className="absolute top-0 left-0 h-full bg-green-500"
                                style={{ width: `${progressPercentage}%` }}
                            />
                        </div>
                    </div>

                    {/* View Project Button */}
                    <div className="mt-auto">
                        <Link href={`/projects/${id}`} passHref>
                            <Button className="w-full">View Project</Button>
                        </Link>
                    </div>
                </div>
            </Card>
        </div>
    );
};
