"use client";

import { useQuery } from "@tanstack/react-query";
import { taskLabelService } from "@/services/task-label.service";
import { labelQueryKeys } from "@/lib/query/query-keys";
import type { TaskResponseDto as Task } from "@todo/shared";

export function useTaskLabels(task: Task) {
  return useQuery({
    queryKey: labelQueryKeys.byTask(task.id),
    queryFn: taskLabelService.getMyTaskLabels,
    select: (labels) =>
      labels.filter((label) =>
        task.labels.some((taskLabel) => taskLabel.id === label.id)
      ),
    staleTime: 1000 * 60 * 5,
  });
}
