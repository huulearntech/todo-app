"use client";

import { useQueryClient } from "@tanstack/react-query";
import { usePostponeTask } from "@/features/tasks/hooks/use-postpone-task";
import { useUpdateTask } from "@/features/tasks/hooks/use-update-task";
import { taskQueryKeys } from "@/lib/query/query-keys";
import { toast } from "@/components/ui/toast";
import type { TaskResponseDto as Task } from "@todo/shared";

/**
 * Calculates the target postponed date:
 * - Postpones the date to tomorrow (next day).
 * - If the task already has a scheduled time (timeRange.start), preserves its exact time of day.
 * - If the task has no time set, postpones the date to tomorrow with default time.
 */
export function calculatePostponedDate(task: Pick<Task, "timeRange">): string {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  if (task.timeRange?.start) {
    const originalStart = new Date(task.timeRange.start);
    if (!isNaN(originalStart.getTime())) {
      tomorrow.setHours(
        originalStart.getHours(),
        originalStart.getMinutes(),
        originalStart.getSeconds(),
        originalStart.getMilliseconds()
      );
    }
  }

  return tomorrow.toISOString();
}

export function usePostponeTaskWithUndo() {
  const queryClient = useQueryClient();
  const postponeTaskMutation = usePostponeTask();
  const updateTaskMutation = useUpdateTask({ suppressToast: true });

  const postponeWithUndo = (
    taskToPostpone: Task,
    originalIndex: number,
    onRestored?: (task: Task, index: number) => void
  ) => {
    const taskId = taskToPostpone.id;
    const tomorrowIso = calculatePostponedDate(taskToPostpone);

    // 1. Dispatch immediate mutation
    postponeTaskMutation.mutate({ taskId, postponeTo: tomorrowIso });

    // 2. Show Toast with Compensating Undo Action
    const postponeToastId = toast.add({
      title: "Task postponed",
      description: `"${taskToPostpone.title}" postponed to tomorrow.`,
      type: "success",
      actionProps: {
        children: "Undo",
        onClick: () => {
          // Restore original timeRange on backend
          updateTaskMutation.mutate({
            taskId,
            data: {
              timeRange: taskToPostpone.timeRange,
            },
          });

          // Optimistically restore into today's query cache immediately
          queryClient.setQueryData<Task[]>(taskQueryKeys.dueToday(), (old) => {
            if (!old || !Array.isArray(old)) return [taskToPostpone];
            if (old.some((t) => t.id === taskId)) return old;
            const restored = [...old];
            const insertIndex =
              originalIndex >= 0 && originalIndex <= old.length
                ? originalIndex
                : old.length;
            restored.splice(insertIndex, 0, taskToPostpone);
            return restored;
          });

          onRestored?.(taskToPostpone, originalIndex);

          if (postponeToastId) {
            toast.close(postponeToastId);
          }

          toast.add({
            title: "Postpone undone",
            description: `"${taskToPostpone.title}" restored to today's list.`,
            type: "info",
          });
        },
      },
    });
  };

  return {
    postponeWithUndo,
    isPostponing: postponeTaskMutation.isPending,
  };
}
