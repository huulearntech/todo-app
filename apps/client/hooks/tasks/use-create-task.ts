"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { taskService } from "@/services/task.service";
import { taskQueryKeys } from "@/lib/query/query-keys";
import { toast } from "@/components/ui/toast";
import type { TaskResponseDto as Task } from "@todo/shared";
import type { CreateTaskOutput } from "@todo/shared/browser";

interface UseCreateTaskOptions {
  onSuccess?: (data: Task) => void;
}

export function useCreateTask(options?: UseCreateTaskOptions) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (newTask: CreateTaskOutput) => taskService.createTask(newTask),
    onMutate: async (newTask) => {
      await queryClient.cancelQueries({ queryKey: taskQueryKeys.all });

      const previousQueries = queryClient.getQueriesData<Task[]>({
        queryKey: taskQueryKeys.all,
      });

      queryClient.setQueriesData<Task[]>(
        { queryKey: taskQueryKeys.all },
        (oldTasks) => {
          if (!oldTasks || !Array.isArray(oldTasks)) return oldTasks;
          return [...oldTasks, { ...newTask, id: `temp-${Date.now()}` } as unknown as Task];
        }
      );

      return { previousQueries };
    },
    onError: (_err, _newTask, context) => {
      if (context?.previousQueries) {
        context.previousQueries.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      toast.add({
        title: "Error creating task",
        description: "An unexpected error occurred while creating the task.",
        type: "error",
      });
    },
    onSuccess: (data) => {
      toast.add({
        title: "Task created",
        description: "The task was created successfully.",
        type: "success",
      });
      options?.onSuccess?.(data);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: taskQueryKeys.all });
    },
  });
}
