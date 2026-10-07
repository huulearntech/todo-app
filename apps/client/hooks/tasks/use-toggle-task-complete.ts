"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { taskService } from "@/services/task.service";
import { taskQueryKeys, productivityQueryKeys } from "@/lib/query/query-keys";
import { toast } from "@/components/ui/toast";
import type { TaskResponseDto as Task } from "@todo/shared";

interface ToggleTaskCompleteVariables {
  task: Task;
  checked: boolean;
}

export function useToggleTaskComplete() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ task, checked }: ToggleTaskCompleteVariables) => {
      if (checked) {
        const scheduledDate = task.timeRange?.start ?? undefined;
        return {
          isComplete: true,
          result: await taskService.completeTaskOccurrence(task.id, {
            scheduledDate,
          }),
        };
      } else {
        return {
          isComplete: false,
          result: await taskService.uncompleteTaskOccurrence(task.id),
        };
      }
    },
    onSuccess: (data, { task }) => {
      if (data.isComplete) {
        const result = data.result as { isRecurringAdvanced?: boolean; nextDueTime?: string | null };
        toast.add({
          title: result?.isRecurringAdvanced
            ? "Occurrence completed"
            : "Task completed",
          description: result?.isRecurringAdvanced
            ? `Next occurrence scheduled for ${
                result.nextDueTime
                  ? new Date(result.nextDueTime).toLocaleDateString()
                  : "future date"
              }.`
            : `"${task.title}" marked as completed.`,
          type: "success",
        });
      } else {
        toast.add({
          title: "Occurrence restored",
          description: `"${task.title}" marked as incomplete.`,
          type: "info",
        });
      }
    },
    onError: () => {
      toast.add({
        title: "Error",
        description: "Failed to update task status",
        type: "error",
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: taskQueryKeys.all });
      queryClient.invalidateQueries({ queryKey: productivityQueryKeys.all });
    },
  });
}
