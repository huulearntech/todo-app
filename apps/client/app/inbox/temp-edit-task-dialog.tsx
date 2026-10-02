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
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
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
          <Breadcrumb>
            <BreadcrumbList className="text-xs">
              <BreadcrumbItem>
                <span className="font-semibold text-foreground truncate max-w-[150px]">
                  {task.section.project.name}
                </span>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage className="truncate max-w-[150px]">
                  {task.section.name}
                </BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
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