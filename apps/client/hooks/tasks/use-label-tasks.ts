"use client";

import { useQuery } from "@tanstack/react-query";
import { taskService } from "@/services/task.service";
import { taskQueryKeys } from "@/lib/query/query-keys";

export function useLabelTasks(labelId: string) {
  const query = useQuery({
    queryKey: taskQueryKeys.byLabel(labelId, "pending"),
    queryFn: () => taskService.getMyTasks({ taskLabelIds: [labelId] }),
    enabled: Boolean(labelId),
  });

  return {
    ...query,
    pendingTasks: query.data ?? [],
  };
}
