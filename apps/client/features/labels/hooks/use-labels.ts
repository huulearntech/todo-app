"use client";

import { useQuery } from "@tanstack/react-query";
import { taskLabelService } from "@/features/tasks/services/task-label.service";
import { labelQueryKeys } from "@/lib/query/query-keys";

import type { TaskLabelResponseDto } from "@todo/shared";

export const EMPTY_LABELS: TaskLabelResponseDto[] = [];

export function useLabels<TData = TaskLabelResponseDto[]>(options?: {
  select?: (data: TaskLabelResponseDto[]) => TData;
}) {
  return useQuery({
    queryKey: labelQueryKeys.all,
    queryFn: taskLabelService.getMyTaskLabels,
    select: options?.select,
  });
}
