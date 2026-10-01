"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "@/components/ui/toast";
import { taskService } from "@/services/task.service";
import { useEditTaskDialogStore } from "@/providers/MyStoreProvider";
import { useMutation } from "@tanstack/react-query";
import type { TaskResponseDto as Task } from "@todo/shared";
import { updateTaskSchema, type UpdateTaskOutput } from "@todo/shared/browser";
import { FolderIcon, LayersIcon } from "lucide-react";
import { TaskForm } from "@/components/(home)/task-form";

export default function TempEditTaskDialog() {
  const task = useEditTaskDialogStore((state) => state.task);
  const setTask = useEditTaskDialogStore((state) => state.setTask);

  const editTaskMutation = useMutation({
    mutationFn: (data: UpdateTaskOutput) => {
      if (!task) throw new Error("No task selected");
      return taskService.updateTask(task.id, data);
    },
    onMutate: async (data, context) => {
      if (!task) return;
      await context.client.cancelQueries({ queryKey: ["tasks"] });
      const previousTasks = context.client.getQueryData<Task[]>(["tasks"]);

      context.client.setQueryData<Task[]>(["tasks"], (old) =>
        old?.map((t) => (t.id === task.id ? { ...t, ...data } : t)) ?? []
      );

      return { previousTasks };
    },
    onError: (_err, _data, onMutateResult, context) => {
      if (onMutateResult?.previousTasks) {
        context.client.setQueryData<Task[]>(["tasks"], onMutateResult.previousTasks);
      }
      toast.add({
        title: "Error updating task",
        description: "An unexpected error occurred.",
        type: "error",
      });
    },
    onSuccess: () => {
      toast.add({
        title: "Task updated",
        description: "Task was updated successfully.",
        type: "success",
      });
      setTask(null);
    },
    onSettled: (_data, _error, _variables, _onMutateResult, context) => {
      context.client.invalidateQueries({ queryKey: ["tasks"] });
    },
  });

  if (!task) {
    return null;
  }

  return (
    <Dialog
      open={!!task}
      onOpenChange={(open) => {
        if (!open) setTask(null);
      }}
    >
      <DialogContent className="sm:max-w-[840px] max-h-[90vh] sm:max-h-[calc(100vh-3rem)] p-0 gap-0 overflow-hidden rounded-2xl border border-border/60 bg-background/95 backdrop-blur-md shadow-2xl flex flex-col">
        {/* Header Breadcrumb Banner */}
        <DialogHeader className="flex flex-row items-center justify-between border-b border-border/40 px-5 py-3 space-y-0 bg-muted/20 shrink-0">
          <div className="flex items-center gap-2 text-xs font-medium min-w-0">
            <span className="size-2 rounded-full bg-primary shrink-0" />
            <div className="flex items-center gap-1.5 truncate">
              <FolderIcon className="size-3.5 text-muted-foreground/70 shrink-0" />
              <span className="text-foreground font-semibold truncate max-w-[150px]">
                {task.section.project.name}
              </span>
              <span className="text-muted-foreground/40">/</span>
              <LayersIcon className="size-3.5 text-muted-foreground/70 shrink-0" />
              <span className="text-muted-foreground truncate max-w-[150px]">
                {task.section.name}
              </span>
            </div>
          </div>
          <DialogTitle className="sr-only">Edit Task: {task.title}</DialogTitle>
        </DialogHeader>

        {/* Shared Todoist Task Form */}
        <TaskForm
          defaultValues={updateTaskSchema.encode(task)}
          onSubmit={(data) => editTaskMutation.mutate(data)}
          onCancel={() => setTask(null)}
          isPending={editTaskMutation.isPending}
          submitLabel="Save changes"
          submittingLabel="Saving..."
          autoFocusTitle={false}
        />
      </DialogContent>
    </Dialog>
  );
}