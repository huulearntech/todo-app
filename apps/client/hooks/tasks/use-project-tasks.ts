"use client";

import { useQuery } from "@tanstack/react-query";
import { taskService } from "@/services/task.service";
import { taskQueryKeys } from "@/lib/query/query-keys";

export function useProjectTasks(projectId: string) {
  return useQuery({
    queryKey: taskQueryKeys.byProject(projectId),
    queryFn: () => taskService.getTasksByProjectId(projectId),
    enabled: Boolean(projectId),
  });
}
