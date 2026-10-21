"use client";

import { useQuery } from "@tanstack/react-query";
import { taskService } from "@/features/tasks/services/task.service";
import { taskQueryKeys } from "@/lib/query/query-keys";
import type { TaskResponseDto } from "@todo/shared";

export const EMPTY_TASKS: TaskResponseDto[] = [];

export interface UseProjectTasksOptions<TData = TaskResponseDto[]> {
  select?: (data: TaskResponseDto[]) => TData;
}

export function useProjectTasks<TData = TaskResponseDto[]>(
  projectId: string,
  options?: UseProjectTasksOptions<TData>
) {
  return useQuery({
    queryKey: taskQueryKeys.byProject(projectId, "pending"),
    queryFn: () => taskService.getTasksByProjectId(projectId),
    enabled: Boolean(projectId),
    select: options?.select,
  });
}
