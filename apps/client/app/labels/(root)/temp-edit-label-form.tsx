"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { taskLabelService } from "@/services/task-label.service";
import { toast } from "@/components/ui/toast";

import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

import { updateTaskLabelSchema, type UpdateTaskLabelDto } from "@todo/shared";
import { TaskLabel } from "@/types/task-label.type";


export default function Dialog_EditLabel({
  label,
  setLabel,
}: {
  label: TaskLabel;
  setLabel: (label: TaskLabel | null) => void;
}) {

  const { control, handleSubmit, formState: { errors }, reset } = useForm<UpdateTaskLabelDto>({
    resolver: zodResolver(updateTaskLabelSchema),
    defaultValues: {
      id: label.id,
      name: label.name,
      description: label.description || "",
    },
  });

  const updateLabelMutation = useMutation({
    mutationFn: taskLabelService.updateTaskLabel,
    onMutate: async (updatedLabel, context) => {
      // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
      await context.client.cancelQueries({ queryKey: ["task-labels"] });

      // Snapshot the previous value
      const previousLabels = context.client.getQueryData<TaskLabel[]>(["task-labels"]);

      // Optimistically update to the new value
      context.client.setQueryData<TaskLabel[]>(["task-labels"], (old) => {
        if (!old) return [];
        return old.map((label) =>
          label.id === updatedLabel.id ? { ...label, ...updatedLabel } : label
        );
      });

      // Return a context object with the snapshotted value
      return { previousLabels };
    },
    onError: (_err, _updatedLabel, onMutateResult, context) => {
      // Rollback to the previous value
      if (onMutateResult?.previousLabels) {
        context.client.setQueryData(["task-labels"], onMutateResult.previousLabels);
      }
    },
    onSettled: (_data, _error, _variables, _onMutateResult, context) => {
      // Always refetch after error or success:
      context.client.invalidateQueries({ queryKey: ["task-labels"] });
    },
  });

  const onSubmit = (data: UpdateTaskLabelDto) => updateLabelMutation.mutate(data, {
    onSuccess: () => {
      toast.add({
        title: "Label updated",
        description: "The label was updated successfully.",
        type: "success",
      });
    },
    onError: () => {
      toast.add({
        title: "Error updating label",
        description: "An unexpected error occurred.",
        type: "error",
      });
    },
    onSettled: () => {
      reset();
      setLabel(null);
    }
  });

  return (
    <Dialog open={!!label} onOpenChange={(open) => {
      if(!open) setLabel(null);
    }}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{label.name}</DialogTitle>
          <DialogDescription>
            {label.description}
          </DialogDescription>
        </DialogHeader>
        <form
          id="add-task-label-form"
          onSubmit={handleSubmit(onSubmit)}
        >
          <FieldGroup>
            <Controller
              name="name"
              control={control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="name">Name</FieldLabel>
                  <Input id="name" {...field} />
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
                  <Input id="description" {...field} />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
          </FieldGroup>
        </form>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setLabel(null)}>
            Cancel
            </Button>
          <Button type="submit" form="add-task-label-form">Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
