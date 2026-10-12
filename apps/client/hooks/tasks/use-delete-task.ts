"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { taskService } from "@/services/task.service";
import { taskQueryKeys, productivityQueryKeys } from "@/lib/query/query-keys";
import { toast } from "@/components/ui/toast";
import type { CompletedOccurrenceResponseDto, TaskResponseDto as Task } from "@todo/shared";
import { getErrorMessage } from "@/lib/api-error";

export function useDeleteTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (taskId: string) => taskService.deleteTask(taskId),
    onMutate: async (taskId: string) => {
      await queryClient.cancelQueries({ queryKey: taskQueryKeys.all });
      await queryClient.cancelQueries({ queryKey: taskQueryKeys.completed() });

      // Optimistically remove from all pending queries
      queryClient.setQueriesData<Task[]>({ queryKey: taskQueryKeys.all }, (old) => {
        if (!old || !Array.isArray(old)) return old;
        return old.filter((t) => t.id !== taskId);
      });

      // Optimistically remove from completed occurrences query
      queryClient.setQueryData<CompletedOccurrenceResponseDto[]>(
        taskQueryKeys.completed(),
        (old) => old?.filter((o) => o.id !== taskId) ?? [],
      );
    },
    onError: (err: unknown) => {
      toast.add({
        title: "Error",
        description: getErrorMessage(err, "Failed to delete task"),
        type: "error",
      });
    },
    onSuccess: () => {
      toast.add({
        title: "Task deleted",
        description: "The task and its occurrences were permanently deleted.",
        type: "success",
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: taskQueryKeys.all });
      queryClient.invalidateQueries({ queryKey: taskQueryKeys.completed() });
      queryClient.invalidateQueries({ queryKey: productivityQueryKeys.all });
    },
  });
}
