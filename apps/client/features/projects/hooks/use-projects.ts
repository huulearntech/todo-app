"use client";

import { useQuery } from "@tanstack/react-query";
import { projectService } from "@/features/projects/services/project.service";
import { projectQueryKeys } from "@/lib/query/query-keys";

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
