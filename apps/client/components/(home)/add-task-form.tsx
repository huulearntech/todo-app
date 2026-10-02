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
import { sectionService } from "@/services/section.service";
import { projectService } from "@/services/project.service";
import { useMutation, useQuery } from "@tanstack/react-query";
import type { TaskResponseDto as Task } from "@todo/shared";
import {
  createTaskSchemaDefaultValues,
  type CreateTaskOutput,
} from "@todo/shared/browser";


import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

import { FolderIcon, LayersIcon, Plus } from "lucide-react";
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

  // Fetch section and project details to show Todoist breadcrumbs in header
  const { data: section } = useQuery({
    queryKey: ["section", sectionId],
    queryFn: () => sectionService.getSectionById(sectionId!),
    enabled: !!sectionId && dialogIsOpen,
  });

  const { data: project } = useQuery({
    queryKey: ["project", section?.projectId],
    queryFn: () => projectService.getProjectById(section!.projectId),
    enabled: !!section?.projectId && dialogIsOpen,
  });

  const createTaskMutation = useMutation({
    mutationFn: (newTask: CreateTaskOutput) => taskService.createTask(newTask),
    onMutate: async (newTask, context) => {
      await context.client.cancelQueries({ queryKey: ["tasks"] });

      const previousTasks = context.client.getQueryData<Task[]>(["tasks"]);

      context.client.setQueryData<Task[]>(["tasks"], (oldTasks) => {
        if (!oldTasks) return [newTask as Task];
        // FIX: Fuck it, the AI again patches code with some bullshit
        // and I'll find myself dumb as fuck in the future with these kind of subtle bugs
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
        {/* Header Breadcrumb Banner */}
        {/* Why does these AI like to decorate using some redundant bullshit that does not mean
          * any damn thing to the user?
          */}
        <DialogHeader className="flex flex-row items-center justify-between border-b border-border/40 px-5 py-3 space-y-0 bg-muted/20 shrink-0">
          {/* <div className="flex items-center gap-2 text-xs font-medium min-w-0">
            <div className="flex items-center gap-1.5 truncate">
              {project ? (
                <>
                  <FolderIcon className="size-3.5 text-muted-foreground/70 shrink-0" />
                  <span className="text-foreground font-semibold truncate max-w-[150px]">
                    {project.name}
                  </span>
                  <span className="text-muted-foreground/40">/</span>
                </>
              ) : null}
              {section ? (
                <>
                  <LayersIcon className="size-3.5 text-muted-foreground/70 shrink-0" />
                  <span className="text-muted-foreground truncate max-w-[150px]">
                    {section.name}
                  </span>
                </>
              ) : (
                <span className="text-foreground font-semibold">New Task</span>
              )}
            </div>
          </div> */}

          <Breadcrumb>
            <BreadcrumbList className="text-xs">
              <BreadcrumbItem>
                <span className="font-semibold text-foreground truncate max-w-[150px]">
                  {project?.name || "TODO: Fix AI bullshit"}
                </span>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage className="truncate max-w-[150px]">
                  {section?.name || "TODO: Fix AI bullshit"}
                </BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          <DialogTitle className="sr-only">Add Task</DialogTitle>
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