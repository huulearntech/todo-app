"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { taskService } from "@/features/tasks/services/task.service";
import { taskQueryKeys, productivityQueryKeys } from "@/lib/query/query-keys";
import { toast } from "@/components/ui/toast";
import type { CompletedOccurrenceResponseDto } from "@todo/shared";
import { getErrorMessage } from "@/lib/api-error";

export function useDeleteOccurrence() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (occurrenceId: string) =>
      taskService.deleteOccurrenceById(occurrenceId),
    onMutate: async (occurrenceId: string) => {
      await queryClient.cancelQueries({ queryKey: taskQueryKeys.all });

      const previousOccurrences = queryClient.getQueriesData<
        CompletedOccurrenceResponseDto[]
      >({ queryKey: taskQueryKeys.all });

      queryClient.setQueriesData<CompletedOccurrenceResponseDto[]>(
        { queryKey: taskQueryKeys.all },
        (old) => {
          if (!old || !Array.isArray(old)) return old;
          return old.filter(
            (o) => !("occurrenceId" in o) || o.occurrenceId !== occurrenceId
          );
        }
      );

      return { previousOccurrences };
    },
    onError: (err: unknown, _occurrenceId, context) => {
      if (context?.previousOccurrences) {
        context.previousOccurrences.forEach(([key, data]) => {
          queryClient.setQueryData(key, data);
        });
      }
      toast.add({
        title: "Error",
        description: getErrorMessage(
          err,
          "Failed to delete completed occurrence"
        ),
        type: "error",
      });
    },
    onSuccess: () => {
      toast.add({
        title: "Occurrence deleted",
        description: "The completed occurrence was deleted successfully.",
        type: "success",
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: taskQueryKeys.all });
      queryClient.invalidateQueries({ queryKey: productivityQueryKeys.all });
    },
  });
}
