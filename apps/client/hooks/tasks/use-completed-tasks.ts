"use client";

import { useQuery } from "@tanstack/react-query";
import { taskService } from "@/services/task.service";
import { taskQueryKeys } from "@/lib/query/query-keys";
import type { CompletedOccurrenceResponseDto } from "@todo/shared";

export function useCompletedTasks() {
  return useQuery<CompletedOccurrenceResponseDto[]>({
    queryKey: taskQueryKeys.completed(),
    queryFn: async () => {
      const result = await taskService.getMyTasks({ status: "completed" });
      return (result as unknown as CompletedOccurrenceResponseDto[]) ?? [];
    },
  });
}
