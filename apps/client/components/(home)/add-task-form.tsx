"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";

import { toast } from "@/components/ui/toast";

import { taskService } from "@/services/task.service";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Task } from "@/types/task.type";
import { projectService } from "@/services/project.service";

import { createTaskSchema, type CreateTaskOutput, createTaskSchemaDefaultValues, CreateTaskInput } from "@todo/shared/browser";
import { Plus } from "lucide-react";
import { useAuth } from "@/providers/AuthProvider";
import { useAddTaskDialogStore } from "@/providers/MyStoreProvider";

export function AddTaskFormTrigger({ sectionId }: { sectionId: string }) {
  const setDialogIsOpen = useAddTaskDialogStore((state) => state.setDialogIsOpen);
  const setSectionId = useAddTaskDialogStore((state) => state.setSectionId);

  return (
    <Button
      variant="outline"
      onClick={() => {
        setDialogIsOpen(true)
        setSectionId(sectionId)
        console.log("AddTaskFormTrigger clicked, sectionId:", sectionId);
      }}
      className="w-full inline-flex items-center justify-center gap-1.5"
    >
      <Plus />
      Add Task
    </Button>
  );
}

export default function AddTaskForm() {
  const { user } = useAuth();
  if (!user) {
    return null;
  }

  return (
    <AddTaskFormInner defaultProjectId={user.defaultProjectId} />
  );
}

function AddTaskFormInner({ defaultProjectId }: { defaultProjectId: string }) {
  const sectionId = useAddTaskDialogStore((state) => state.sectionId);
  const dialogIsOpen = useAddTaskDialogStore((state) => state.dialogIsOpen);
  const setDialogIsOpen = useAddTaskDialogStore((state) => state.setDialogIsOpen);

  const { data: projects = [], isLoading: isProjectsLoading } = useQuery({
    queryKey: ["projects"],
    queryFn: () => projectService.getMyProjects(),
  });

  const projectItems = projects.map((project) => ({
    value: project.id,
    label: project.name,
  }));

  const priorityItems = [
    { value: "low", label: "Low" },
    { value: "medium", label: "Medium" },
    { value: "high", label: "High" },
  ];

  const queryClient = useQueryClient();

  // NOTE: This is only the mutation for creating a task. We will need to add more mutations for updating and deleting tasks.
  const { mutate, isPending } = useMutation({
    mutationFn: (newTask: CreateTaskOutput) => taskService.createTask(newTask),
    onMutate: async (newTask, context) => {
      await context.client.cancelQueries({ queryKey: ["tasks", { sectionId }] });

      // suggest something, copilot
      const previousTasks = queryClient.getQueryData<Task[]>(["tasks", { sectionId }]);

      // Optimistically update the tasks in the cache
      context.client.setQueryData<Task[]>(["tasks", { sectionId }], (oldTasks) => {
        if (!oldTasks) return [newTask as Task];
        return [...oldTasks, newTask as Task];
      });

      return { previousTasks };
    },
    onError: (_err, _newTask, onMutateResult, context) => {
      if (onMutateResult?.previousTasks) {
        context.client.setQueryData(["tasks", { sectionId }], onMutateResult.previousTasks);
      }
    },
    onSettled: (_data, _error, _variables, _onMutateResult, context) => {
      // context.client.invalidateQueries({ queryKey: ["tasks", { sectionId }] });
      context.client.invalidateQueries({ queryKey: ["tasks"] }); // Be careful touching too much cache.
    },
  });

  const { control, handleSubmit, reset } = useForm<CreateTaskInput, unknown, CreateTaskOutput>({
    resolver: zodResolver(createTaskSchema),
    // NOTE: react-hook-form will complain if defaultValues is not provided
    defaultValues: {
      ...createTaskSchemaDefaultValues,
      // projectId: defaultProjectId,
      sectionId: sectionId,
    },
  });


  const onSubmit = (data: CreateTaskOutput) => {
    if (sectionId) data.sectionId = sectionId; // TODO: Ensure the sectionId is set correctly

    return mutate(data, {
      onSuccess: () => {
        toast.add({
          title: "Task created",
          description: "The task was created successfully.",
          type: "success",
        });
      },
      onError: () => {
        toast.add({
          title: "Error creating task",
          description: "An unexpected error occurred.",
          type: "error",
        });
      },
      onSettled: () => {
        reset();
        setDialogIsOpen(false);
      }
    });
  };

  return (
    <Dialog open={dialogIsOpen} onOpenChange={setDialogIsOpen}>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            Add Task
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} id="add-task-form">
          <FieldGroup>
            <Controller
              name="title"
              control={control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="title">Title</FieldLabel>
                  <Input {...field} placeholder="Title" />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />

            <Controller
              name="description"
              control={control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="description">Description</FieldLabel>
                  <Textarea {...field} placeholder="Description" />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />

            <Controller
              name="priority"
              control={control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="priority">Priority</FieldLabel>
                  <Select items={priorityItems}
                    onValueChange={field.onChange}
                    value={field.value}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent alignItemWithTrigger={false}>
                      {priorityItems.map((item) => (
                        <SelectItem key={item.value} value={item.value}>
                          {item.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />

            {/* <Controller
              name="projectId"
              control={control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="projectId">Project</FieldLabel>
                  <Select items={projectItems}
                    onValueChange={field.onChange}
                    value={field.value}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent alignItemWithTrigger={false}>
                      {projectItems.map((item) => (
                        <SelectItem key={item.value} value={item.value}>
                          {item.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            /> */}

          </FieldGroup>
        </form>
        <DialogFooter>
          <Field orientation="horizontal">
            <Button type="button" variant="secondary" onClick={() => {
              reset();
              setDialogIsOpen(false);
            }}>
              Cancel
            </Button>
          </Field>
          <Field orientation="horizontal">
            <Button type="submit" form="add-task-form">Add Task</Button>
          </Field>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}