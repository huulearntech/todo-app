"use client";

import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { useColors } from "@/hooks/colors/use-colors";
import { useUpdateLabel } from "@/features/labels/hooks/use-update-label";
import { toast } from "@/components/ui/toast";
import { getColorConfig } from "@/lib/color-palette";

import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";

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


export default function EditLabelDialog({
  label,
  setLabel,
}: {
  label: TaskLabel;
  setLabel: (label: TaskLabel | null) => void;
}) {
  const { data: colors = [] } = useColors();

  const { control, handleSubmit, reset } = useForm<UpdateTaskLabelDto>({
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
              render={({ field, fieldState }) => {
                const selectedColor = colors.find(
                  (c) => c.key === field.value,
                );
                const selectedConfig = getColorConfig(field.value);

                return (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="edit-label-color">Color</FieldLabel>
                    <Select
                      id="edit-label-color"
                      value={field.value}
                      onValueChange={field.onChange}
                    >
                      <SelectTrigger>
                        <div className="flex items-center gap-2 w-full">
                          <span
                            className={`size-3.5 rounded-full shrink-0 border border-black/10 dark:border-white/10 ${selectedConfig.dotClass}`}
                          />
                          <span>{selectedColor?.name || selectedConfig.label}</span>
                          <span className="text-xs text-muted-foreground ml-auto font-mono">
                            {field.value}
                          </span>
                        </div>
                      </SelectTrigger>
                      <SelectContent>
                        {colors.map((color) => {
                          const config = getColorConfig(color.key);
                          return (
                            <SelectItem
                              key={color.key}
                              value={color.key}
                              className="rounded-lg cursor-pointer"
                            >
                              <div className="flex items-center gap-2 w-full">
                                <span
                                  className={`size-3.5 rounded-full shrink-0 border border-black/10 dark:border-white/10 ${config.dotClass}`}
                                />
                                <span>{color.name}</span>
                                <span className="text-xs text-muted-foreground ml-auto font-mono">
                                  {color.key}
                                </span>
                              </div>
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                );
              }}
            />
          </FieldGroup>
        </form>
        <DialogFooter className="gap-2 pt-2">
          <Button type="button" variant="outline" onClick={() => setLabel(null)} className="rounded-xl h-9 px-4 text-xs font-medium">
            Cancel
          </Button>
          <Button type="submit" form="edit-task-label-form" className="rounded-xl h-9 px-4 text-xs font-semibold shadow-xs">Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
