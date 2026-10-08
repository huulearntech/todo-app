"use client";

import { useQuery } from "@tanstack/react-query";
import { taskService } from "@/services/task.service";
import { taskQueryKeys } from "@/lib/query/query-keys";

export function useLabelTasks(
  labelId: string,
  options?: { includeCompleted?: boolean },
) {
  const pendingQuery = useQuery({
    queryKey: taskQueryKeys.byLabel(labelId, "pending"),
    queryFn: () => taskService.getMyTasks({ taskLabelIds: [labelId] }),
    enabled: Boolean(labelId),
  });

  const completedQuery = useQuery({
    queryKey: taskQueryKeys.byLabel(labelId, "completed"),
    queryFn: () =>
      taskService.getMyCompletedOccurrences({ taskLabelIds: [labelId] }),
    enabled: Boolean(labelId && options?.includeCompleted),
  });

  return {
    ...pendingQuery,
    pendingTasks: pendingQuery.data ?? [],
    completedOccurrences: completedQuery.data ?? [],
    isCompletedLoading: completedQuery.isLoading,
  };
}
