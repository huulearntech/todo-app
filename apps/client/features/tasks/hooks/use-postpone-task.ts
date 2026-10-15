import { useMutation, useQueryClient } from "@tanstack/react-query";
import { taskService } from "@/features/tasks/services/task.service";
import { taskQueryKeys, productivityQueryKeys } from "@/lib/query/query-keys";
import type { TaskResponseDto as Task } from "@todo/shared";
import { toast } from "@/components/ui/toast";
import { getErrorMessage } from "@/lib/api-error";

interface PostponeTaskVariables {
  taskId: string;
  postponeTo: string;
}

export function usePostponeTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ taskId, postponeTo }: PostponeTaskVariables) =>
      taskService.postponeTask(taskId, postponeTo),
    onMutate: async ({ taskId, postponeTo }) => {
      // 1. Cancel outgoing queries for all tasks so in-flight queries don't overwrite optimistic data
      await queryClient.cancelQueries({ queryKey: taskQueryKeys.all });

      // 2. Snapshot current caches for rollback
      const previousDueToday = queryClient.getQueryData<Task[]>(
        taskQueryKeys.dueToday()
      );
      const previousAllQueries = queryClient.getQueriesData<Task[]>({
        queryKey: taskQueryKeys.all,
      });

      // 3. Optimistically remove the task from due-today list
      queryClient.setQueryData<Task[]>(taskQueryKeys.dueToday(), (old) => {
        if (!old || !Array.isArray(old)) return old;
        return old.filter((t) => t.id !== taskId);
      });

      // 4. Optimistically update timeRange in all cached task lists
      queryClient.setQueriesData<Task[]>(
        { queryKey: taskQueryKeys.all },
        (old) => {
          if (!old || !Array.isArray(old)) return old;
          return old.map((t) =>
            t.id === taskId
              ? {
                  ...t,
                  timeRange: t.timeRange
                    ? {
                        start: postponeTo,
                        end: t.timeRange.end,
                      }
                    : {
                        start: postponeTo,
                        end: postponeTo,
                      },
                }
              : t
          );
        }
      );

      return { previousDueToday, previousAllQueries };
    },
    onError: (err, _variables, context) => {
      // Roll back to snapshots on failure
      if (context?.previousDueToday) {
        queryClient.setQueryData(
          taskQueryKeys.dueToday(),
          context.previousDueToday
        );
      }
      if (context?.previousAllQueries) {
        context.previousAllQueries.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      toast.add({
        title: "Failed to postpone task",
        description: getErrorMessage(
          err,
          "An error occurred while postponing the task."
        ),
        type: "error",
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: taskQueryKeys.dueToday() });
      queryClient.invalidateQueries({ queryKey: taskQueryKeys.all });
      queryClient.invalidateQueries({ queryKey: productivityQueryKeys.all });
    },
  });
}

