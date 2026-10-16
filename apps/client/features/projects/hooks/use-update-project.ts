"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { projectService } from "@/features/projects/services/project.service";
import { projectQueryKeys } from "@/lib/query/query-keys";
import type { UpdateProjectDto } from "@todo/shared";

interface UpdateProjectVariables {
  projectId: string;
  data: UpdateProjectDto;
}

export function useUpdateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ projectId, data }: UpdateProjectVariables) =>
      projectService.updateProject(projectId, data),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: projectQueryKeys.all });
    },
  });
}
