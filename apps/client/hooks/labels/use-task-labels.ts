import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { taskLabelService } from "@/services/task-label.service";
import { labelQueryKeys } from "@/lib/query/query-keys";
import type { TaskResponseDto as Task } from "@todo/shared";

export function useAllTaskLabels() {
  return useQuery({
    queryKey: labelQueryKeys.all,
    queryFn: taskLabelService.getMyTaskLabels,
    staleTime: 1000 * 60 * 5,
  });
}

export function useTaskLabels(task: Task) {
  const query = useAllTaskLabels();
  const taskLabels = task.labels;

  const labels = useMemo(() => {
    if (!query.data || !taskLabels || taskLabels.length === 0) return [];
    return query.data.filter((label) =>
      taskLabels.some((taskLabel) => taskLabel.id === label.id)
    );
  }, [query.data, taskLabels]);

  return {
    ...query,
    data: labels,
  };
}
