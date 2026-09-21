"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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
  label: TaskLabel | null;
  setLabel: (label: TaskLabel | null) => void;
}) {
  const queryClient = useQueryClient();

  const { control, handleSubmit, formState: { errors }, reset } = useForm<UpdateTaskLabelDto>({
    resolver: zodResolver(updateTaskLabelSchema),
    defaultValues: label && {
      id: label.id,
      name: label.name,
      description: label.description || "",
    } || {
      id: "",
      name: "",
      description: "",
    },
  });

  const updateLabelMutation = useMutation({
    mutationFn: (data: UpdateTaskLabelDto) => taskLabelService.updateTaskLabel(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["labels"] });
      reset();
    },
    onError: () => {
      toast.add({
        title: "Error creating label",
        description: "An unexpected error occurred.",
        type: "error",
      });
      reset();
    }
  });

  const onSubmit = async (data: UpdateTaskLabelDto) => {
    toast.promise(
      updateLabelMutation.mutateAsync(data),
      {
        loading: "Creating label...",
        success: "Label created successfully!",
        error: "Error creating label.",
      }
    );
    setLabel(null);
  };

  if (!label) {
    return null;
  }

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
