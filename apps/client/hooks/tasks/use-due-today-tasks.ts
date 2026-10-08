"use client";

import { useQuery } from "@tanstack/react-query";
import { taskService } from "@/services/task.service";
import { taskQueryKeys } from "@/lib/query/query-keys";

export function useDueTodayTasks(options?: { includeCompleted?: boolean }) {
  const pendingQuery = useQuery({
    queryKey: taskQueryKeys.dueToday("pending"),
    queryFn: () => taskService.getMyTasksDueToday(),
  });

  const completedQuery = useQuery({
    queryKey: taskQueryKeys.dueToday("completed"),
    queryFn: () => taskService.getMyCompletedOccurrencesDueToday(),
    enabled: Boolean(options?.includeCompleted),
  });

  return {
    ...pendingQuery,
    pendingTasks: pendingQuery.data ?? [],
    completedOccurrences: completedQuery.data ?? [],
    isCompletedLoading: completedQuery.isLoading,
  };
}
