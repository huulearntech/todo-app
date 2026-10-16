"use client";

import { useQueryClient } from "@tanstack/react-query";
import { taskLabelService } from "@/features/tasks/services/task-label.service";
import { labelQueryKeys } from "@/lib/query/query-keys";
import type { TaskLabelResponseDto as TaskLabel } from "@todo/shared";
import { toast } from "@/components/ui/toast";

export function useDeleteLabelWithUndo(labels: TaskLabel[]) {
  const queryClient = useQueryClient();

  const deleteLabelWithUndo = (labelToDelete: TaskLabel) => {
    const targetIndex = labels.findIndex((l) => l.id === labelToDelete.id);

    // 1. Optimistic UI update: remove label from query cache
    queryClient.setQueryData<TaskLabel[]>(labelQueryKeys.all, (old) =>
      old ? old.filter((l) => l.id !== labelToDelete.id) : []
    );

    let isUndone = false;

    // 2. Pending server update timeout reference
    const deleteTimeout = setTimeout(async () => {
      if (isUndone) return;
      try {
        await taskLabelService.deleteTaskLabel(labelToDelete.id);
        queryClient.invalidateQueries({ queryKey: labelQueryKeys.all });
      } catch {
        queryClient.setQueryData<TaskLabel[]>(labelQueryKeys.all, (old) => {
          if (!old) return [labelToDelete];
          if (old.some((l) => l.id === labelToDelete.id)) return old;
          const next = [...old];
          if (targetIndex >= 0 && targetIndex <= next.length) {
            next.splice(targetIndex, 0, labelToDelete);
          } else {
            next.push(labelToDelete);
          }
          return next;
        });
        toast.add({
          title: "Error deleting label",
          description: `Failed to delete "${labelToDelete.name}".`,
          type: "error",
        });
      }
    }, 4000);

    // 3. Show Toast with Undo Action
    const toastId = toast.add({
      title: "Label deleted",
      description: `"${labelToDelete.name}" was deleted.`,
      type: "success",
      actionProps: {
        children: "Undo",
        onClick: () => {
          isUndone = true;
          clearTimeout(deleteTimeout);

          // Restore label back into local React Query cache
          queryClient.setQueryData<TaskLabel[]>(labelQueryKeys.all, (old) => {
            if (!old) return [labelToDelete];
            if (old.some((l) => l.id === labelToDelete.id)) return old;
            const next = [...old];
            if (targetIndex >= 0 && targetIndex <= next.length) {
              next.splice(targetIndex, 0, labelToDelete);
            } else {
              next.push(labelToDelete);
            }
            return next;
          });

          if (toastId) {
            toast.close(toastId);
          }

          toast.add({
            title: "Deletion cancelled",
            description: `"${labelToDelete.name}" was restored.`,
            type: "info",
          });
        },
      },
    });
  };

  return { deleteLabelWithUndo };
}
