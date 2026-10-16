"use client";

import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { useUpdateLabel } from "@/features/labels/hooks/use-update-label";
import { toast } from "@/components/ui/toast";
import { ColorSelect } from "@/components/ui/color-select";

import {
  Field,
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
} from "@/components/ui/dialog";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

import { updateTaskLabelSchema, type UpdateTaskLabelDto } from "@todo/shared";
import type { TaskLabelResponseDto as TaskLabel } from "@todo/shared";

export interface EditLabelDialogProps {
  label: TaskLabel;
  onClose: () => void;
}

export default function EditLabelDialog({
  label,
  onClose,
}: EditLabelDialogProps) {
  const [open, setOpen] = useState(true);

  const { control, handleSubmit } = useForm<UpdateTaskLabelDto>({
    resolver: zodResolver(updateTaskLabelSchema),
    defaultValues: {
      name: label.name,
      description: label.description || "",
      colorKey: label.colorKey || "slate",
    },
  });

  const updateLabelMutation = useUpdateLabel();

  const onSubmit = (data: UpdateTaskLabelDto) =>
    updateLabelMutation.mutate(
      { id: label.id, data },
      {
        onSuccess: () => {
          toast.add({
            title: "Label updated",
            description: "The label was updated successfully.",
            type: "success",
          });
          setOpen(false);
        },
        onError: () => {
          toast.add({
            title: "Error updating label",
            description: "An unexpected error occurred.",
            type: "error",
          });
        },
      }
    );

  return (
    <Dialog
      open={open}
      onOpenChange={setOpen}
      onOpenChangeComplete={(isOpen) => {
        if (!isOpen) onClose();
      }}
    >
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="card-heading">Edit Label</DialogTitle>
          <DialogDescription className="card-subheading">
            Update the name, description, or color of this label.
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
              name="colorKey"
              control={control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="edit-label-color">Color</FieldLabel>
                  <ColorSelect
                    id="edit-label-color"
                    value={field.value}
                    onValueChange={field.onChange}
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
          </FieldGroup>
        </form>
        <DialogFooter className="gap-2 pt-2">
          <Button type="button" variant="outline" onClick={() => setOpen(false)} className="rounded-xl h-9 px-4 text-xs font-medium">
            Cancel
          </Button>
          <Button type="submit" form="edit-task-label-form" className="rounded-xl h-9 px-4 text-xs font-semibold shadow-xs">Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
