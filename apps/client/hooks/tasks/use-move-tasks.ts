"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { taskService } from "@/services/task.service";
import { taskQueryKeys } from "@/lib/query/query-keys";
import type { TaskResponseDto as Task } from "@todo/shared";

interface MoveTasksVariables {
  taskId: string;
  sectionId: string;
  prevId: string | null;
}

export function useMoveTasks(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ taskId, sectionId, prevId }: MoveTasksVariables) => {
      await taskService.updateTaskOrder({ taskId, prevId, sectionId });
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: taskQueryKeys.byProject(projectId) });
      const previousTasks = queryClient.getQueryData<Task[]>(
        taskQueryKeys.byProject(projectId)
      );
      return { previousTasks };
    },
    onError: (_error, _variables, onMutateResult) => {
      if (onMutateResult?.previousTasks) {
        queryClient.setQueryData(
          taskQueryKeys.byProject(projectId),
          onMutateResult.previousTasks
        );
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: taskQueryKeys.byProject(projectId) });
    },
  });
}
