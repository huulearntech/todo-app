"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { taskLabelService } from "@/services/task-label.service";
import { labelQueryKeys } from "@/lib/query/query-keys";
import type { CreateTaskLabelDto, TaskLabelResponseDto } from "@todo/shared";

export function useCreateLabel() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateTaskLabelDto) => taskLabelService.createTaskLabel(data),
    onMutate: async (newLabel) => {
      await queryClient.cancelQueries({ queryKey: labelQueryKeys.all });

      const previousTaskLabels = queryClient.getQueryData<TaskLabelResponseDto[]>(
        labelQueryKeys.all
      );

      queryClient.setQueryData<TaskLabelResponseDto[]>(
        labelQueryKeys.all,
        (oldTaskLabels = []) => [
          ...oldTaskLabels,
          { id: `temp-${Date.now()}`, ...newLabel } as TaskLabelResponseDto,
        ]
      );

      return { previousTaskLabels };
    },
    onError: (_error, _newLabel, onMutateResult) => {
      if (onMutateResult?.previousTaskLabels) {
        queryClient.setQueryData(labelQueryKeys.all, onMutateResult.previousTaskLabels);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: labelQueryKeys.all });
    },
  });
}
