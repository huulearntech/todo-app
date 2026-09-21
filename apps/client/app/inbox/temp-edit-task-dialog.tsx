"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Field,
  FieldError,
  FieldGroup,
  FieldLabel
} from "@/components/ui/field";

import { Task } from "@/types/task.type";
import { useEditTaskDialogStore } from "@/providers/MyStoreProvider";

import { useForm, Controller } from "react-hook-form";

import { zodResolver } from "@hookform/resolvers/zod";
import { TaskPriority, updateTaskSchema, type UpdateTaskDto } from "@todo/shared"
import { useEffect } from "react";

export default function TempEditTaskDialog() {
  const task = useEditTaskDialogStore((state) => state.task);
  const setTask = useEditTaskDialogStore((state) => state.setTask);

  console.log("task: ", task);

  const { control, handleSubmit, reset } = useForm<UpdateTaskDto>({
    resolver: zodResolver(updateTaskSchema),
    defaultValues: task && {
      title: task.title,
      description: task.description,
      priority: task.priority,
    } || {
      title: "",
      description: "",
      priority: TaskPriority.MEDIUM,
    },
  });

  // useEffect(() => {
  //   if (task) {
  //     reset({
  //       title: task.title,
  //       description: task.description,
  //       priority: task.priority,
  //     });
  //   }
  // }, [task, reset]);

  if (!task) {
    return null;
  }

  return (
    <Dialog open={!!task} onOpenChange={(open) => { if (!open) setTask(null); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle> {task.title} </DialogTitle>
          <DialogDescription> {task.description} </DialogDescription>
        </DialogHeader>

        <form
          id="edit-task-form"
          onSubmit={handleSubmit((data) => {
            console.log("Form submitted with data:", data);
          })}>
          <FieldGroup>
            <Controller
              name="title"
              control={control}
              render={({ field, fieldState }) => (
                <Field>
                  <FieldLabel htmlFor="title">Title</FieldLabel>
                  <Input {...field} id="title" placeholder="Task title" />
                  {fieldState.error && (<FieldError errors={[fieldState.error]} />)}
                </Field>
              )}
            />

            <Controller
              name="description"
              control={control}
              render={({ field, fieldState }) => (
                <Field>
                  <FieldLabel htmlFor="description">Description</FieldLabel>
                  <Textarea {...field} id="description" placeholder="Task description" />
                  {fieldState.error && (<FieldError errors={[fieldState.error]} />)}
                </Field>
              )}
            />

            <Controller
              name="priority"
              control={control}
              render={({ field, fieldState }) => (
                <Field>
                  <FieldLabel htmlFor="priority">Priority</FieldLabel>
                  <Select {...field} value={field.value} onValueChange={field.onChange} id="priority">
                    <SelectTrigger>
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                  {fieldState.error && (<FieldError errors={[fieldState.error]} />)}
                </Field>
              )}
            />
          </FieldGroup>
        </form>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setTask(null)}>
            Cancel
          </Button>
          <Button type="submit" form="edit-task-form">Save changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}