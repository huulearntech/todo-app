"use client";

import { useQuery } from "@tanstack/react-query";
import { projectService } from "@/features/projects/services/project.service";
import { sectionQueryKeys } from "@/lib/query/query-keys";

export function useSections(projectId: string) {
  return useQuery({
    queryKey: sectionQueryKeys.byProject(projectId),
    queryFn: () => projectService.getSectionsByProjectId(projectId),
    enabled: Boolean(projectId),
  });
}
