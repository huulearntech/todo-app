"use client";

import { useQuery } from "@tanstack/react-query";
import { taskService } from "@/services/task.service";
import { taskQueryKeys } from "@/lib/query/query-keys";

export function useLabelTasks(labelId: string) {
  return useQuery({
    queryKey: taskQueryKeys.byLabel(labelId),
    queryFn: () => taskService.getMyTasks({ taskLabelIds: [labelId] }),
    enabled: Boolean(labelId),
  });
}
