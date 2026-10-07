"use client";

import { useQuery } from "@tanstack/react-query";
import { taskService } from "@/services/task.service";
import { taskQueryKeys } from "@/lib/query/query-keys";

export function useDueTodayTasks() {
  return useQuery({
    queryKey: taskQueryKeys.dueToday(),
    queryFn: () => taskService.getMyTasksDueToday(),
  });
}
