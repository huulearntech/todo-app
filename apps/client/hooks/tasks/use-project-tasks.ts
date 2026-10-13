"use client";

import { useQuery } from "@tanstack/react-query";
import { taskService } from "@/services/task.service";
import { taskQueryKeys } from "@/lib/query/query-keys";
import type { TaskResponseDto } from "@todo/shared";

export const EMPTY_TASKS: TaskResponseDto[] = [];

export function useProjectTasks(projectId: string) {
  return useQuery({
    queryKey: taskQueryKeys.byProject(projectId, "pending"),
    queryFn: () => taskService.getTasksByProjectId(projectId),
    enabled: Boolean(projectId),
  });
}
