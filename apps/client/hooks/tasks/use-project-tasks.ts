"use client";

import { useQuery } from "@tanstack/react-query";
import { taskService } from "@/services/task.service";
import { taskQueryKeys } from "@/lib/query/query-keys";

export function useProjectTasks(
  projectId: string,
  options?: { includeCompleted?: boolean },
) {
  const pendingQuery = useQuery({
    queryKey: taskQueryKeys.byProject(projectId, "pending"),
    queryFn: () => taskService.getTasksByProjectId(projectId),
    enabled: Boolean(projectId),
  });

  const completedQuery = useQuery({
    queryKey: taskQueryKeys.byProject(projectId, "completed"),
    queryFn: () => taskService.getCompletedOccurrencesByProjectId(projectId),
    enabled: Boolean(projectId && options?.includeCompleted),
  });

  return {
    ...pendingQuery,
    pendingTasks: pendingQuery.data ?? [],
    completedOccurrences: completedQuery.data ?? [],
    isCompletedLoading: completedQuery.isLoading,
  };
}
