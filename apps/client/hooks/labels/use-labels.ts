"use client";

import { useQuery } from "@tanstack/react-query";
import { taskLabelService } from "@/services/task-label.service";
import { labelQueryKeys } from "@/lib/query/query-keys";

import type { TaskLabelResponseDto } from "@todo/shared";

export function useLabels<TData = TaskLabelResponseDto[]>(options?: {
  select?: (data: TaskLabelResponseDto[]) => TData;
}) {
  return useQuery({
    queryKey: labelQueryKeys.all,
    queryFn: taskLabelService.getMyTaskLabels,
    select: options?.select,
  });
}
