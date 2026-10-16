"use client";

import { useQuery } from "@tanstack/react-query";
import { taskService } from "@/features/tasks/services/task.service";
import { taskQueryKeys } from "@/lib/query/query-keys";
import { EMPTY_TASKS } from "@/features/tasks/hooks/use-project-tasks";

export function useDueTodayTasks() {
  const query = useQuery({
    queryKey: taskQueryKeys.dueToday("pending"),
    queryFn: () => taskService.getMyTasksDueToday(),
  });

  return {
    ...query,
    pendingTasks: query.data ?? EMPTY_TASKS,
  };
}
