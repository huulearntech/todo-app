"use client";

import { useQuery } from "@tanstack/react-query";
import { taskService } from "@/services/task.service";
import { taskQueryKeys } from "@/lib/query/query-keys";

export function useDueTodayTasks() {
  const query = useQuery({
    queryKey: taskQueryKeys.dueToday("pending"),
    queryFn: () => taskService.getMyTasksDueToday(),
  });

  return {
    ...query,
    pendingTasks: query.data ?? [],
  };
}
