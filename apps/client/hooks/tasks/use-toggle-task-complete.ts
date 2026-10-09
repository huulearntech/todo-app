"use client";

import { useQueryClient } from "@tanstack/react-query";
import { taskService } from "@/services/task.service";
import { taskQueryKeys, productivityQueryKeys } from "@/lib/query/query-keys";
import { toast } from "@/components/ui/toast";
import type { TaskResponseDto as Task } from "@todo/shared";

interface ToggleTaskCompleteVariables {
  task: Task;
  checked: boolean;
  occurrenceId?: string;
}

interface PendingCompletion {
  timeoutId: ReturnType<typeof setTimeout>;
  task: Task;
  toastId: string;
}

const pendingCompletions = new Map<string, PendingCompletion>();

// Flush any pending completions if the browser tab closes or unloads
if (typeof window !== "undefined") {
  window.addEventListener("beforeunload", () => {
    for (const [taskId, { timeoutId, task }] of pendingCompletions.entries()) {
      clearTimeout(timeoutId);
      const scheduledDate = task.timeRange?.start ?? undefined;
      taskService
        .completeTaskOccurrence(taskId, { scheduledDate })
        .catch(() => {});
    }
    pendingCompletions.clear();
  });
}

export function useToggleTaskComplete() {
  const queryClient = useQueryClient();

  const mutate = async ({
    task,
    checked,
    occurrenceId,
  }: ToggleTaskCompleteVariables) => {
    if (checked) {
      // 1. If this task already has a pending completion timeout, clear it first
      const existing = pendingCompletions.get(task.id);
      if (existing) {
        clearTimeout(existing.timeoutId);
        if (existing.toastId) {
          toast.close(existing.toastId);
        }
        pendingCompletions.delete(task.id);
      }

      // 2. Optimistically remove the task from all active query lists in the cache
      queryClient.setQueriesData<Task[]>(
        { queryKey: taskQueryKeys.all },
        (old) => {
          if (!old || !Array.isArray(old)) return old;
          return old.filter((t) => t.id !== task.id);
        },
      );

      // 3. Set a 4-second timeout to perform the server request
      let isUndone = false;
      const scheduledDate = task.timeRange?.start ?? undefined;

      const timeoutId = setTimeout(async () => {
        if (isUndone) return;
        pendingCompletions.delete(task.id);

        try {
          const result = await taskService.completeTaskOccurrence(task.id, {
            scheduledDate,
          });

          // Refresh task queries, productivity stats, and completed list
          queryClient.invalidateQueries({ queryKey: taskQueryKeys.all });
          queryClient.invalidateQueries({
            queryKey: taskQueryKeys.completed(),
          });
          queryClient.invalidateQueries({
            queryKey: productivityQueryKeys.all,
          });

          if (result?.isRecurringAdvanced) {
            toast.add({
              title: "Occurrence completed",
              description: `Next occurrence scheduled for ${
                result.nextDueTime
                  ? new Date(result.nextDueTime).toLocaleDateString()
                  : "future date"
              }.`,
              type: "info",
            });
          }
        } catch (err: any) {
          // Rollback: restore the task into active queries
          queryClient.setQueriesData<Task[]>(
            { queryKey: taskQueryKeys.all },
            (old) => {
              if (!old || !Array.isArray(old)) return old;
              if (old.some((t) => t.id === task.id)) return old;
              return [task, ...old];
            },
          );

          const message =
            err?.response?.data?.message ??
            err?.message ??
            "Failed to complete task";
          toast.add({
            title: "Error",
            description: message,
            type: "error",
          });
        }
      }, 4000);

      // 4. Show toast with Undo action
      const toastId = toast.add({
        title: "Task completed",
        description: `"${task.title}" marked as completed.`,
        type: "success",
        actionProps: {
          children: "Undo",
          onClick: () => {
            isUndone = true;
            clearTimeout(timeoutId);
            pendingCompletions.delete(task.id);

            // Restore the task back into active queries
            queryClient.setQueriesData<Task[]>(
              { queryKey: taskQueryKeys.all },
              (old) => {
                if (!old || !Array.isArray(old)) return old;
                if (old.some((t) => t.id === task.id)) return old;
                return [task, ...old];
              },
            );

            if (toastId) {
              toast.close(toastId);
            }

            toast.add({
              title: "Completion undone",
              description: `"${task.title}" restored.`,
              type: "info",
            });
          },
        },
      });

      pendingCompletions.set(task.id, { timeoutId, task, toastId });
    } else {
      // Uncompleting a task occurrence
      // If there was a pending completion in flight for this task, cancel it
      const existing = pendingCompletions.get(task.id);
      if (existing) {
        clearTimeout(existing.timeoutId);
        if (existing.toastId) {
          toast.close(existing.toastId);
        }
        pendingCompletions.delete(task.id);

        // Restore task into active queries
        queryClient.setQueriesData<Task[]>(
          { queryKey: taskQueryKeys.all },
          (old) => {
            if (!old || !Array.isArray(old)) return old;
            if (old.some((t) => t.id === task.id)) return old;
            return [task, ...old];
          },
        );
        return;
      }

      try {
        if (occurrenceId) {
          await taskService.uncompleteOccurrenceById(occurrenceId);
        } else {
          await taskService.uncompleteTaskOccurrence(task.id);
        }

        toast.add({
          title: "Occurrence restored",
          description: `"${task.title}" restored as incomplete.`,
          type: "info",
        });
      } catch (err: any) {
        const message =
          err?.response?.data?.message ??
          err?.message ??
          "Failed to restore task";
        toast.add({
          title: "Error",
          description: message,
          type: "error",
        });
      } finally {
        queryClient.invalidateQueries({ queryKey: taskQueryKeys.all });
        queryClient.invalidateQueries({ queryKey: taskQueryKeys.completed() });
        queryClient.invalidateQueries({
          queryKey: productivityQueryKeys.all,
        });
      }
    }
  };

  return {
    mutate,
    mutateAsync: mutate,
    isPending: false,
  };
}
