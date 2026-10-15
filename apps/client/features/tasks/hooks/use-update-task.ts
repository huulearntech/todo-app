"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { taskService } from "@/features/tasks/services/task.service";
import {
  taskQueryKeys,
  productivityQueryKeys,
} from "@/lib/query/query-keys";
import { toast } from "@/components/ui/toast";
import type { TaskResponseDto as Task } from "@todo/shared";
import type { UpdateTaskOutput } from "@todo/shared/browser";

interface UpdateTaskVariables {
  taskId: string;
  data: Partial<UpdateTaskOutput>;
}

interface UseUpdateTaskOptions {
  onSuccess?: (data: Task) => void;
  suppressToast?: boolean;
}

export function useUpdateTask(options?: UseUpdateTaskOptions) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ taskId, data }: UpdateTaskVariables) =>
      taskService.updateTask(taskId, data),
    onMutate: async ({ taskId, data }) => {
      await queryClient.cancelQueries({ queryKey: taskQueryKeys.all });
      const previousQueries = queryClient.getQueriesData<Task[]>({
        queryKey: taskQueryKeys.all,
      });

      queryClient.setQueriesData<Task[]>({ queryKey: taskQueryKeys.all }, (old) => {
        if (!old || !Array.isArray(old)) return old;
        return old.map((t) => {
          if (t.id !== taskId) return t;
          const updatedReminders = (data.reminders ?? t.reminders ?? []).map(
            (r, idx) =>
              r.type === "relative"
                ? {
                    id: r.id ?? t.reminders?.[idx]?.id ?? `temp-reminder-${idx}`,
                    type: "relative" as const,
                    minuteOffset: r.minuteOffset ?? 0,
                    channel: r.channel,
                  }
                : {
                    id: r.id ?? t.reminders?.[idx]?.id ?? `temp-reminder-${idx}`,
                    type: "absolute" as const,
                    remindAt: r.remindAt ?? new Date().toISOString(),
                    channel: r.channel,
                  }
          );
          return {
            ...t,
            ...data,
            reminders: updatedReminders,
          };
        });
      });

      return { previousQueries };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousQueries) {
        context.previousQueries.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      toast.add({
        title: "Error updating task",
        description: "An unexpected error occurred.",
        type: "error",
      });
    },
    onSuccess: (data) => {
      if (!options?.suppressToast) {
        toast.add({
          title: "Task updated",
          description: "Task was updated successfully.",
          type: "success",
        });
      }
      options?.onSuccess?.(data);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: taskQueryKeys.all });
      queryClient.invalidateQueries({ queryKey: productivityQueryKeys.all });
    },
  });
}
