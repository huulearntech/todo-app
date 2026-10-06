"use client";

import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { taskLabelService } from "@/services/task-label.service";
import { colorService } from "@/services/color.service";
import { toast } from "@/components/ui/toast";

import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
import type { TaskLabelResponseDto as TaskLabel } from "@todo/shared";


export default function Dialog_EditLabel({
  label,
  setLabel,
}: {
  label: TaskLabel;
  setLabel: (label: TaskLabel | null) => void;
}) {
  const { data: colors = [] } = useQuery({
    queryKey: ["colors"],
    queryFn: colorService.getMyColors,
  });

  const { control, handleSubmit, reset } = useForm<UpdateTaskLabelDto>({
    resolver: zodResolver(updateTaskLabelSchema),
    defaultValues: {
      id: label.id,
      name: label.name,
      description: label.description || "",
      colorHexCode: label.colorHexCode || "#E0E0E0",
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
      if (!open) setLabel(null);
    }}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Label</DialogTitle>
          <DialogDescription>
            Update the name and description of this label.
          </DialogDescription>
        </DialogHeader>
        <form
          id="edit-task-label-form"
          onSubmit={handleSubmit(onSubmit)}
        >
          <FieldGroup>
            <Controller
              name="name"
              control={control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="edit-name">Name</FieldLabel>
                  <Input id="edit-name" {...field} />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
            <Controller
              name="description"
              control={control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="edit-description">Description</FieldLabel>
                  <Input id="edit-description" {...field} />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
            <Controller
              name="colorHexCode"
              control={control}
              render={({ field, fieldState }) => {
                const selectedColor = colors.find(
                  (c) => c.hexCode.toUpperCase() === field.value?.toUpperCase(),
                );
                return (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="edit-label-color">Color</FieldLabel>
                    <Select
                      id="edit-label-color"
                      value={field.value}
                      onValueChange={field.onChange}
                    >
                      <SelectTrigger className="w-full h-9 rounded-xl border-border/60 bg-background/80 hover:bg-background transition-colors text-xs font-medium">
                        <div className="flex items-center gap-2 w-full">
                          <span
                            className="size-3.5 rounded-full shrink-0 border border-black/10 dark:border-white/10"
                            style={{ backgroundColor: field.value }}
                          />
                          <span>{selectedColor?.name || field.value || "Select color"}</span>
                          <span className="text-[10px] text-muted-foreground ml-auto uppercase font-mono">
                            {field.value}
                          </span>
                        </div>
                      </SelectTrigger>
                      <SelectContent alignItemWithTrigger={false} className="rounded-xl">
                        {colors.map((color) => (
                          <SelectItem
                            key={color.hexCode}
                            value={color.hexCode}
                            className="text-xs rounded-lg cursor-pointer"
                          >
                            <div className="flex items-center gap-2 w-full">
                              <span
                                className="size-3.5 rounded-full shrink-0 border border-black/10 dark:border-white/10"
                                style={{ backgroundColor: color.hexCode }}
                              />
                              <span>{color.name}</span>
                              <span className="text-[10px] text-muted-foreground ml-auto uppercase font-mono">
                                {color.hexCode}
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                );
              }}
            />
          </FieldGroup>
        </form>
        <DialogFooter className="gap-2">
          <Button type="button" variant="outline" onClick={() => setLabel(null)} className="rounded-lg">
            Cancel
          </Button>
          <Button type="submit" form="edit-task-label-form" className="rounded-lg">Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
