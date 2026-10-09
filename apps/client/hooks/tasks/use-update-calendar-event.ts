"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { taskService } from "@/services/task.service";
import { taskQueryKeys } from "@/lib/query/query-keys";
import { toast } from "@/components/ui/toast";
import type { TaskResponseDto as Task } from "@todo/shared";
import type { UpdateTaskOutput } from "@todo/shared/browser";
import type { EventCalendarProposedUpdate } from "@/components/reui/event-calendar/event-calendar-types";

export function useUpdateCalendarEvent(
  projectId: string,
  options?: { onRollback?: (previousTasks: Task[]) => void }
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (updated: EventCalendarProposedUpdate<Task>) => {
      const {
        start,
        end,
        event: { title, data },
      } = updated;
      if (!data) {
        throw new Error("Event data is missing for the updated event.");
      }

      // ReUI calendar uses TZDate, convert to Date before toISOString()
      const startStr = new Date(start).toISOString();
      const endStr = new Date(end).toISOString();

      const taskToUpdate: UpdateTaskOutput = {
        title,
        description: data.description,
        timeRange: { start: startStr, end: endStr },
        priority: data.priority,
        sectionId: data.sectionId,
        labels: data.labels,
        reminders: data.reminders ?? [],
      };

      return taskService.updateTask(updated.event.id, taskToUpdate);
    },
    onMutate: async (updated) => {
      const previousTasks = queryClient.getQueryData<Task[]>(
        taskQueryKeys.byProject(projectId)
      );

      const startStr = new Date(updated.start).toISOString();
      const endStr = new Date(updated.end).toISOString();

      queryClient.setQueryData<Task[]>(
        taskQueryKeys.byProject(projectId),
        (oldTasks) =>
          oldTasks?.map((task) =>
            task.id === updated.event.id
              ? {
                  ...task,
                  timeRange: { start: startStr, end: endStr },
                }
              : task
          ) || []
      );

      await queryClient.cancelQueries({ queryKey: taskQueryKeys.byProject(projectId) });

      return { previousTasks };
    },
    onSuccess: (updatedTask) => {
      queryClient.setQueryData<Task[]>(
        taskQueryKeys.byProject(projectId),
        (oldTasks) =>
          oldTasks?.map((task) =>
            task.id === updatedTask.id ? { ...task, ...updatedTask } : task
          ) || []
      );
    },
    onError: (_error, _updatedEvent, onMutateResult) => {
      if (onMutateResult?.previousTasks) {
        queryClient.setQueryData(
          taskQueryKeys.byProject(projectId),
          onMutateResult.previousTasks
        );
        options?.onRollback?.(onMutateResult.previousTasks);
      }
      toast.add({
        title: "Error moving event",
        description: "Failed to update event schedule. Reverting changes.",
        type: "error",
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: taskQueryKeys.byProject(projectId) });
    },
  });
}
