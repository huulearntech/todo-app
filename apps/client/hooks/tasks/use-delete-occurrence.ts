"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { taskService } from "@/services/task.service";
import { taskQueryKeys, productivityQueryKeys } from "@/lib/query/query-keys";
import { toast } from "@/components/ui/toast";
import type { CompletedOccurrenceResponseDto } from "@todo/shared";

export function useDeleteOccurrence() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (occurrenceId: string) =>
      taskService.deleteOccurrenceById(occurrenceId),
    onMutate: async (occurrenceId: string) => {
      await queryClient.cancelQueries({ queryKey: taskQueryKeys.completed() });

      const previousOccurrences = queryClient.getQueryData<
        CompletedOccurrenceResponseDto[]
      >(taskQueryKeys.completed());

      queryClient.setQueryData<CompletedOccurrenceResponseDto[]>(
        taskQueryKeys.completed(),
        (old) => old?.filter((o) => o.occurrenceId !== occurrenceId) ?? [],
      );

      return { previousOccurrences };
    },
    onError: (err: any, _occurrenceId, context) => {
      if (context?.previousOccurrences) {
        queryClient.setQueryData(
          taskQueryKeys.completed(),
          context.previousOccurrences,
        );
      }
      const message =
        err?.response?.data?.message ??
        err?.message ??
        "Failed to delete completed occurrence";
      toast.add({
        title: "Error",
        description: message,
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
      queryClient.invalidateQueries({ queryKey: taskQueryKeys.completed() });
      queryClient.invalidateQueries({ queryKey: productivityQueryKeys.all });
    },
  });
}
