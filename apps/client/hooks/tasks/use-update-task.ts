"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { taskService } from "@/services/task.service";
import {
  taskQueryKeys,
  productivityQueryKeys,
} from "@/lib/query/query-keys";
import { toast } from "@/components/ui/toast";
import type { TaskResponseDto as Task } from "@todo/shared";
import type { UpdateTaskOutput } from "@todo/shared/browser";

interface UpdateTaskVariables {
  taskId: string;
  data: UpdateTaskOutput;
}

interface UseUpdateTaskOptions {
  onSuccess?: (data: Task) => void;
}

export function useUpdateTask(options?: UseUpdateTaskOptions) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ taskId, data }: UpdateTaskVariables) =>
      taskService.updateTask(taskId, data),
    onMutate: async ({ taskId, data }) => {
      await queryClient.cancelQueries({ queryKey: taskQueryKeys.all });
      const previousTasks = queryClient.getQueryData<Task[]>(taskQueryKeys.all);

      queryClient.setQueryData<Task[]>(taskQueryKeys.all, (old) =>
        old?.map((t) => {
          if (t.id !== taskId) return t;
          const updatedReminders = (data.reminders ?? t.reminders ?? []).map(
            (r, idx) => ({
              id: r.id ?? t.reminders?.[idx]?.id ?? `temp-reminder-${idx}`,
              taskId: t.id,
              type: r.type,
              minuteOffset: r.minuteOffset,
              channel: r.channel,
              remindAt: r.remindAt ?? null,
            })
          );
          return {
            ...t,
            ...data,
            reminders: updatedReminders,
          };
        }) ?? []
      );

      return { previousTasks };
    },
    onError: (_err, _variables, onMutateResult) => {
      if (onMutateResult?.previousTasks) {
        queryClient.setQueryData<Task[]>(taskQueryKeys.all, onMutateResult.previousTasks);
      }
      toast.add({
        title: "Error updating task",
        description: "An unexpected error occurred.",
        type: "error",
      });
    },
    onSuccess: (data) => {
      toast.add({
        title: "Task updated",
        description: "Task was updated successfully.",
        type: "success",
      });
      options?.onSuccess?.(data);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: taskQueryKeys.all });
      queryClient.invalidateQueries({ queryKey: productivityQueryKeys.goals() });
      queryClient.invalidateQueries({
        queryKey: productivityQueryKeys.completedLast7Days(),
      });
    },
  });
}
