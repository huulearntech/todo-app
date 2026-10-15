"use client";

import { useQuery } from "@tanstack/react-query";
import { projectService } from "@/features/projects/services/project.service";
import { projectQueryKeys } from "@/lib/query/query-keys";

export function useProjects(filter?: "non_default" | "all") {
  return useQuery({
    queryKey: filter === "non_default" ? projectQueryKeys.nonDefault() : projectQueryKeys.all,
    queryFn: () =>
      filter === "non_default"
        ? projectService.getMyNonDefaultProjects()
        : projectService.getMyProjects(),
  });
}
