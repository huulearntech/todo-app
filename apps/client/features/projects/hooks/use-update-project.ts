"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { projectService } from "@/features/projects/services/project.service";
import { projectQueryKeys } from "@/lib/query/query-keys";
import type { UpdateProjectDto } from "@todo/shared";

export function useUpdateProject(hookProjectId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (
      variables:
        | { projectId?: string; data: UpdateProjectDto }
        | UpdateProjectDto
    ) => {
      const id =
        "projectId" in variables && variables.projectId
          ? variables.projectId
          : hookProjectId;
      const data = "data" in variables ? variables.data : variables;
      if (!id) throw new Error("Project ID is required to update project");
      return projectService.updateProject(id, data);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: projectQueryKeys.all });
    },
  });
}
