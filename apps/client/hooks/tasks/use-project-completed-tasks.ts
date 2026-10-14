"use client";

import { useQuery } from "@tanstack/react-query";
import { taskService } from "@/services/task.service";
import { taskQueryKeys } from "@/lib/query/query-keys";
import type { CompletedOccurrenceResponseDto } from "@todo/shared";

export function useProjectCompletedTasks(projectId: string) {
  return useQuery<CompletedOccurrenceResponseDto[]>({
    queryKey: taskQueryKeys.byProject(projectId, "completed"),
    queryFn: async () => {
      const result = await taskService.getCompletedOccurrencesByProjectId(projectId);
      return result ?? [];
    },
    enabled: Boolean(projectId),
  });
}
