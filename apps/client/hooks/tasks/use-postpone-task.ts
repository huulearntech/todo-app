"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { taskService } from "@/services/task.service";
import { taskQueryKeys } from "@/lib/query/query-keys";

interface PostponeTaskVariables {
  taskId: string;
  postponeTo: string;
}

export function usePostponeTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ taskId, postponeTo }: PostponeTaskVariables) =>
      taskService.postponeTask(taskId, postponeTo),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: taskQueryKeys.dueToday() });
      queryClient.invalidateQueries({ queryKey: taskQueryKeys.all });
    },
  });
}
