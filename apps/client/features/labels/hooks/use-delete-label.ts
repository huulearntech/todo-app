"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { taskLabelService } from "@/features/tasks/services/task-label.service";
import { labelQueryKeys } from "@/lib/query/query-keys";

export function useDeleteLabel() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => taskLabelService.deleteTaskLabel(id),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: labelQueryKeys.all });
    },
  });
}
