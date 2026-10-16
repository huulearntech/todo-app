"use client";

import { useQuery } from "@tanstack/react-query";
import { projectService } from "@/features/projects/services/project.service";
import { projectQueryKeys } from "@/lib/query/query-keys";
import type { ProjectResponseDto } from "@todo/shared";

export const EMPTY_PROJECTS: ProjectResponseDto[] = [];

export function useProjects(filter?: "non_default" | "all") {
  return filter === "non_default" ?
    useQuery({
      queryKey: projectQueryKeys.nonDefault(),
      queryFn: () => projectService.getMyNonDefaultProjects()
    })
    :
    useQuery({
      queryKey: projectQueryKeys.all,
      queryFn: () => projectService.getMyProjects()
    })
}
