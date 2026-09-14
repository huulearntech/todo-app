"use client";

import { useState } from "react";
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
  DialogTrigger,
} from "@/components/ui/dialog";

import { toast } from "@/components/ui/toast";

// TODO: move
import { z } from "zod";
import { taskService } from "@/services/task.service";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Task } from "@/types/task.type";
import { projectService } from "@/services/project.service";


const taskSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  dueDate: z.date().optional(),
  priority: z.enum(["low", "medium", "high"]).optional(),
  completed: z.boolean().optional(), // NOTE: of course this should be false.
  projectId: z.string().optional(), // NOTE: this is the id of the project that the task belongs to. If not provided, the task will be added to the default project (Inbox).
});

export default function AddTaskForm() {
  const [open, setOpen] = useState(false);

  const { data: projects = [], isLoading: isProjectsLoading } = useQuery({
    queryKey: ["projects"],
    queryFn: () => projectService.getMyProjects(),
  });

  const projectItems = projects.map((project) => ({
    value: project.id,
    label: project.title,
  }));

  const priorityItems = [
    { value: "low", label: "Low" },
    { value: "medium", label: "Medium" },
    { value: "high", label: "High" },
  ];

  const queryClient = useQueryClient();

  // NOTE: This is only the mutation for creating a task. We will need to add more mutations for updating and deleting tasks.
  const { mutate, isPending, isError, error } = useMutation({
    mutationFn: (newTask: z.infer<typeof taskSchema>) => taskService.createTask(newTask),
    onSuccess: (addedTask) => {
      // queryClient.invalidateQueries({ queryKey: ["tasks"] });
      // NOTE: Or we can use queryClient.setQueryData to update the cache directly, but invalidating is simpler for now.

      queryClient.setQueryData<Task[]>(["tasks"], (oldTasks) => {
        if (!oldTasks) return [addedTask];
        return [...oldTasks, addedTask];
      });
    },
  });

  const { control, handleSubmit, reset } = useForm({
    resolver: zodResolver(taskSchema),
    // NOTE: react-hook-form will complain if defaultValues is not provided
    defaultValues: {
      title: "",
      description: "",
      dueDate: undefined,
      priority: "high",
      completed: false,
      projectId: "", // TODO: this need to be set to the default project (Inbox) if not provided
    },
  });

  const onSubmit = async (data: z.infer<typeof taskSchema>) => {
    mutate(
      data,
      {
        onSuccess: (addedTask) => {
          // queryClient.invalidateQueries({ queryKey: ["tasks"] });
          // NOTE: Or we can use queryClient.setQueryData to update the cache directly, but invalidating is simpler for now.
          queryClient.setQueryData<Task[]>(["tasks"], (oldTasks) => {
            if (!oldTasks) return [addedTask];
            return [...oldTasks, addedTask];
          });
          toast.add({
            title: "Task added",
            description: `Task "${addedTask.title}" has been added successfully.`,
            type: "success",
          });
        },
      }
    );
    // TODO: reset the form after submission.
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={
        <Button variant="secondary" className="w-full">
          Add Task
        </Button>
      } />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Task</DialogTitle>
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

            <Controller
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
            />

          </FieldGroup>
        </form>
        <DialogFooter>
          <Field orientation="horizontal">
            <Button type="button" variant="secondary" onClick={() => {
              reset();
              setOpen(false);
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