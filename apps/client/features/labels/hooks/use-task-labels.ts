import { useMemo } from "react";
import { useLabels } from "@/features/labels/hooks/use-labels";
import type { TaskResponseDto as Task, TaskLabelResponseDto as TaskLabel } from "@todo/shared";

const EMPTY_LABELS: TaskLabel[] = [];

export function useTaskLabels(task: Task) {
  const query = useLabels();
  const taskLabels = task.labels;

  const labels = useMemo(() => {
    if (!query.data || !taskLabels || taskLabels.length === 0) return EMPTY_LABELS;
    return query.data.filter((label) =>
      taskLabels.some((taskLabel) => taskLabel.id === label.id)
    );
  }, [query.data, taskLabels]);

  return {
    ...query,
    data: labels,
  };
}
