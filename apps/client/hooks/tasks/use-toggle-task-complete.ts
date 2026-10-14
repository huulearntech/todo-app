"use client";

import { useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { taskService } from "@/services/task.service";
import { taskQueryKeys, productivityQueryKeys } from "@/lib/query/query-keys";
import { toast } from "@/components/ui/toast";
import type { TaskResponseDto as Task } from "@todo/shared";
import { getErrorMessage } from "@/lib/api-error";

interface ToggleTaskCompleteVariables {
  task: Task;
  checked: boolean;
  occurrenceId?: string;
}

interface PendingCompletion {
  timeoutId: ReturnType<typeof setTimeout>;
  task: Task;
  toastId: string;
  scheduledDate?: string;
}

// Global registry of pending delayed completions so separate components don't clash on the same task
const pendingCompletions = new Map<string, PendingCompletion>();

function flushPendingWithKeepalive() {
  for (const [taskId, { timeoutId, scheduledDate }] of pendingCompletions.entries()) {
    clearTimeout(timeoutId);
    try {
      fetch(`/api/tasks/${taskId}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scheduledDate }),
        keepalive: true,
      });
    } catch {
      // Ignore errors during tab unload
    }
  }
  pendingCompletions.clear();
}

export function useToggleTaskComplete() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const handleBeforeUnload = () => {
      flushPendingWithKeepalive();
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, []);

  const completeMutation = useMutation({
    mutationFn: async ({
      taskId,
      scheduledDate,
    }: {
      taskId: string;
      scheduledDate?: string;
    }) => {
      return await taskService.completeTaskOccurrence(taskId, { scheduledDate });
    },
    onSuccess: (result) => {
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
    },
    onError: (err: unknown) => {
      toast.add({
        title: "Error",
        description: getErrorMessage(err, "Failed to complete task"),
        type: "error",
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: taskQueryKeys.all });
      queryClient.invalidateQueries({ queryKey: productivityQueryKeys.all });
    },
  });

  const uncompleteMutation = useMutation({
    mutationFn: async ({
      taskId,
      occurrenceId,
    }: {
      taskId: string;
      occurrenceId?: string;
    }) => {
      if (occurrenceId) {
        return await taskService.uncompleteOccurrenceById(occurrenceId);
      }
      return await taskService.uncompleteTaskOccurrence(taskId);
    },
    onSuccess: () => {
      toast.add({
        title: "Occurrence restored",
        description: "Task restored as incomplete.",
        type: "info",
      });
    },
    onError: (err: unknown) => {
      toast.add({
        title: "Error",
        description: getErrorMessage(err, "Failed to restore task"),
        type: "error",
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: taskQueryKeys.all });
      queryClient.invalidateQueries({ queryKey: productivityQueryKeys.all });
    },
  });

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
          await completeMutation.mutateAsync({
            taskId: task.id,
            scheduledDate,
          });
        } catch {
          // Restore task into active queries on failure
          queryClient.setQueriesData<Task[]>(
            { queryKey: taskQueryKeys.all },
            (old) => {
              if (!old || !Array.isArray(old)) return old;
              if (old.some((t) => t.id === task.id)) return old;
              return [task, ...old];
            },
          );
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

      pendingCompletions.set(task.id, {
        timeoutId,
        task,
        toastId,
        scheduledDate,
      });
    } else {
      // Uncompleting a task occurrence
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

      await uncompleteMutation.mutateAsync({
        taskId: task.id,
        occurrenceId,
      });
    }
  };

  return {
    mutate,
    mutateAsync: mutate,
    isPending: completeMutation.isPending || uncompleteMutation.isPending,
  };
}
