"use client";

import { useQuery } from "@tanstack/react-query";
import { taskService } from "@/services/task.service";
import { taskQueryKeys } from "@/lib/query/query-keys";

export function useProjectTasks(projectId: string) {
  const query = useQuery({
    queryKey: taskQueryKeys.byProject(projectId, "pending"),
    queryFn: () => taskService.getTasksByProjectId(projectId),
    enabled: Boolean(projectId),
  });

  return {
    ...query,
    pendingTasks: query.data ?? [],
  };
}
