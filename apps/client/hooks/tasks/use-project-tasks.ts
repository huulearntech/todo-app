"use client";

import { useQuery } from "@tanstack/react-query";
import { taskService } from "@/services/task.service";
import { taskQueryKeys } from "@/lib/query/query-keys";

export function useProjectTasks(projectId: string) {
  // NOTE: This is where the AI fucked up: Creating new empty array every time.
  // TODO: revise the "Factor out the tanstack queries and mutations"
  // Just because of that it enhaled my 30% of weekly token limit
  // Fuck Google.
  return useQuery({
    queryKey: taskQueryKeys.byProject(projectId, "pending"),
    queryFn: () => taskService.getTasksByProjectId(projectId),
    enabled: Boolean(projectId),
  });
}
