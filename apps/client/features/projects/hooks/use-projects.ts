"use client";

import { useQuery } from "@tanstack/react-query";
import { projectService } from "@/features/projects/services/project.service";
import { projectQueryKeys } from "@/lib/query/query-keys";
import type { ProjectFilterDto, ProjectResponseDto } from "@todo/shared";

export const EMPTY_PROJECTS: ProjectResponseDto[] = [];

export type UseProjectsFilter = "non_default" | "all" | ProjectFilterDto;

export function useProjects(filter?: UseProjectsFilter) {
  const normalizedFilter: ProjectFilterDto | undefined =
    filter === "non_default"
      ? { isDefault: false }
      : filter === "all" || !filter
        ? undefined
        : filter;

  return useQuery({
    queryKey: normalizedFilter
      ? ([...projectQueryKeys.all, "list", normalizedFilter] as const)
      : projectQueryKeys.all,
    queryFn: () => projectService.getMyProjects(normalizedFilter),
  });
}
