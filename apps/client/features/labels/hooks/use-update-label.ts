"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { taskLabelService } from "@/features/tasks/services/task-label.service";
import { labelQueryKeys } from "@/lib/query/query-keys";
import type { UpdateTaskLabelDto, TaskLabelResponseDto } from "@todo/shared";

export function useUpdateLabel() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTaskLabelDto }) =>
      taskLabelService.updateTaskLabel(id, data),
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: labelQueryKeys.all });

      const previousTaskLabels = queryClient.getQueryData<
        TaskLabelResponseDto[]
      >(labelQueryKeys.all);

      queryClient.setQueryData<TaskLabelResponseDto[]>(
        labelQueryKeys.all,
        (oldTaskLabels = []) =>
          oldTaskLabels.map((label) =>
            label.id === id
              ? ({ ...label, ...data } as TaskLabelResponseDto)
              : label,
          ),
      );

      return { previousTaskLabels };
    },
    onError: (_error, _variables, onMutateResult) => {
      if (onMutateResult?.previousTaskLabels) {
        queryClient.setQueryData(
          labelQueryKeys.all,
          onMutateResult.previousTaskLabels,
        );
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: labelQueryKeys.all });
    },
  });
}
