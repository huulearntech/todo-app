"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { taskService } from "@/services/task.service";
import { taskQueryKeys } from "@/lib/query/query-keys";
import { toast } from "@/components/ui/toast";
import { getErrorMessage } from "@/lib/api-error";
import type { TaskResponseDto as Task } from "@todo/shared";

export interface MoveTasksVariables {
  taskId: string;
  sectionId: string;
  prevId: string | null;
}

export function reorderTasksOptimistically(
  oldTasks: Task[],
  { taskId, sectionId, prevId }: MoveTasksVariables
): Task[] {
  const taskToMove = oldTasks.find((t) => t.id === taskId);
  if (!taskToMove) return oldTasks;

  const updatedTask: Task = {
    ...taskToMove,
    sectionId,
    ...(taskToMove.section ? { section: { ...taskToMove.section, id: sectionId } } : {}),
  };

  const remainingTasks = oldTasks.filter((t) => t.id !== taskId);

  if (prevId) {
    const prevIndex = remainingTasks.findIndex((t) => t.id === prevId);
    if (prevIndex !== -1) {
      remainingTasks.splice(prevIndex + 1, 0, updatedTask);
      return remainingTasks;
    }
  }

  // If prevId is null (placed at top of section) or prevId not found:
  const firstIndexInSection = remainingTasks.findIndex(
    (t) => t.sectionId === sectionId
  );
  if (firstIndexInSection !== -1) {
    remainingTasks.splice(firstIndexInSection, 0, updatedTask);
  } else {
    remainingTasks.push(updatedTask);
  }

  return remainingTasks;
}

export function useMoveTasks(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ taskId, sectionId, prevId }: MoveTasksVariables) => {
      await taskService.updateTaskOrder({ taskId, prevId, sectionId });
    },
    onMutate: async (variables: MoveTasksVariables) => {
      await queryClient.cancelQueries({ queryKey: taskQueryKeys.byProject(projectId) });
      const previousTasks = queryClient.getQueryData<Task[]>(
        taskQueryKeys.byProject(projectId)
      );

      // Optimistically update the UI state for immediate feedback
      queryClient.setQueryData<Task[]>(
        taskQueryKeys.byProject(projectId),
        (oldTasks = []) => reorderTasksOptimistically(oldTasks, variables)
      );

      return { previousTasks };
    },
    onError: (err: unknown, _variables, onMutateResult) => {
      if (onMutateResult?.previousTasks) {
        queryClient.setQueryData(
          taskQueryKeys.byProject(projectId),
          onMutateResult.previousTasks
        );
      }
      toast.add({
        title: "Error",
        description: getErrorMessage(err, "Failed to move task"),
        type: "error",
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: taskQueryKeys.byProject(projectId) });
    },
  });
}

