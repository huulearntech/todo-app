"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { projectService } from "@/features/projects/services/project.service";
import { projectQueryKeys } from "@/lib/query/query-keys";
import type { ProjectResponseDto } from "@todo/shared";

export function useProject(projectId: string) {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: projectQueryKeys.detail(projectId),
    queryFn: () => projectService.getProjectById(projectId),
    initialData: () => {
      const cachedLists = queryClient.getQueriesData<ProjectResponseDto[]>({
        queryKey: projectQueryKeys.all,
      });
      for (const [, list] of cachedLists) {
        if (Array.isArray(list)) {
          const match = list.find((p) => p.id === projectId);
          if (match) return match;
        }
      }
      return undefined;
    },
  });
}
