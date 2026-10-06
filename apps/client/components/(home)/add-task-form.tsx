"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { taskService } from "@/services/task.service";
import { useMutation } from "@tanstack/react-query";
import type { TaskResponseDto as Task } from "@todo/shared";
import {
  createTaskSchemaDefaultValues,
  type CreateTaskOutput,
} from "@todo/shared/browser";

import { Plus } from "lucide-react";
import { useAuth } from "@/providers/AuthProvider";
import { useAddTaskDialogStore } from "@/providers/MyStoreProvider";
import { TaskForm } from "./task-form";

export function AddTaskFormTrigger({ sectionId }: { sectionId: string }) {
  const setDialogIsOpen = useAddTaskDialogStore((state) => state.setDialogIsOpen);
  const setSectionId = useAddTaskDialogStore((state) => state.setSectionId);

  return (
    <Button
      variant="ghost"
      onClick={() => {
        setDialogIsOpen(true);
        setSectionId(sectionId);
      }}
      className="text-xs font-medium text-muted-foreground hover:text-foreground">
      <Plus className="size-3.5" />
      Add Task
    </Button>
  );
}

export default function AddTaskDialog() {
  const { user } = useAuth();
  const sectionId = useAddTaskDialogStore((state) => state.sectionId);
  const dialogIsOpen = useAddTaskDialogStore((state) => state.dialogIsOpen);
  const setDialogIsOpen = useAddTaskDialogStore((state) => state.setDialogIsOpen);

  const createTaskMutation = useMutation({
    mutationFn: (newTask: CreateTaskOutput) => taskService.createTask(newTask),
    onMutate: async (newTask, context) => {
      await context.client.cancelQueries({ queryKey: ["tasks"] });

      const previousTasks = context.client.getQueryData<Task[]>(["tasks"]);

      context.client.setQueryData<Task[]>(["tasks"], (oldTasks) => {
        if (!oldTasks) return [newTask as Task];
        return [...oldTasks, { ...newTask, id: `temp-${Date.now()}` } as Task];
      });

      return { previousTasks };
    },
    onError: (_err, _newTask, onMutateResult, context) => {
      if (onMutateResult?.previousTasks) {
        context.client.setQueryData(["tasks"], onMutateResult.previousTasks);
      }
      toast.add({
        title: "Error creating task",
        description: "An unexpected error occurred while creating the task.",
        type: "error",
      });
    },
    onSuccess: () => {
      toast.add({
        title: "Task created",
        description: "The task was created successfully.",
        type: "success",
      });
      setDialogIsOpen(false);
    },
    onSettled: (_data, _error, _variables, _onMutateResult, context) => {
      context.client.invalidateQueries({ queryKey: ["tasks"] });
    },
  });

  if (!user || !sectionId) {
    return null;
  }

  const handleOpenChange = (open: boolean) => {
    setDialogIsOpen(open);
  };

  return (
    <Dialog open={dialogIsOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[840px] max-h-[90vh] sm:max-h-[calc(100vh-3rem)] p-0 gap-0 overflow-hidden rounded-2xl border border-border/60 bg-background/95 backdrop-blur-md shadow-2xl flex flex-col">
        <DialogHeader className="flex flex-row items-center justify-between border-b border-border/40 px-5 py-3 space-y-0 bg-muted/20 shrink-0">
          <DialogTitle className="text-sm font-semibold">Add Task</DialogTitle>
        </DialogHeader>

        {/* Reusable Todoist Task Form */}
        <TaskForm
          defaultValues={{
            ...createTaskSchemaDefaultValues,
            sectionId,
          }}
          onSubmit={(data) => createTaskMutation.mutate(data)}
          onCancel={() => setDialogIsOpen(false)}
          isPending={createTaskMutation.isPending}
          submitLabel="Add Task"
          submittingLabel="Adding..."
          autoFocusTitle={true}
        />
      </DialogContent>
    </Dialog>
  );
}