"use client";

import { useQuery } from "@tanstack/react-query";
import { taskService } from "@/features/tasks/services/task.service";
import { productivityQueryKeys } from "@/lib/query/query-keys";

import type { TaskResponseDto } from "@todo/shared";

export function useCompletedTasksLast7Days<TData = TaskResponseDto[]>(options?: {
  select?: (data: TaskResponseDto[]) => TData;
}) {
  return useQuery({
    queryKey: productivityQueryKeys.completedLast7Days(),
    queryFn: () => taskService.getMyTasksCompletedInLast7Days(),
    select: options?.select,
  });
}
