"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { taskLabelService } from "@/services/task-label.service";
import { labelQueryKeys } from "@/lib/query/query-keys";
import type { UpdateTaskLabelDto, TaskLabelResponseDto } from "@todo/shared";

export function useUpdateLabel() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateTaskLabelDto) => taskLabelService.updateTaskLabel(data),
    onMutate: async (newLabel) => {
      await queryClient.cancelQueries({ queryKey: labelQueryKeys.all });

      const previousTaskLabels = queryClient.getQueryData<TaskLabelResponseDto[]>(
        labelQueryKeys.all
      );

      queryClient.setQueryData<TaskLabelResponseDto[]>(
        labelQueryKeys.all,
        (oldTaskLabels = []) =>
          oldTaskLabels.map((label) =>
            label.id === newLabel.id ? ({ ...label, ...newLabel } as TaskLabelResponseDto) : label
          )
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
