"use client";

import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useCreateLabel } from "@/features/labels/hooks/use-create-label";
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
  DialogTrigger,
} from "@/components/ui/dialog";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2Icon, Plus } from "lucide-react";

import { createTaskLabelSchema, type CreateTaskLabelDto } from "@todo/shared";

export default function AddLabelDialog() {
  const [dialogOpen, setDialogOpen] = useState(false);

  const { control, handleSubmit, reset, formState: { isLoading } } = useForm<CreateTaskLabelDto>({
    resolver: zodResolver(createTaskLabelSchema),
    defaultValues: {
      name: '',
      description: '',
      colorKey: 'slate',
    },
  });

  const createLabelMutation = useCreateLabel();

  const onSubmit = (data: CreateTaskLabelDto) => createLabelMutation.mutate(data, {
    onSuccess: () => {
      toast.add({
        title: "Label created",
        description: "The label was created successfully.",
        type: "success",
      });
    },
    onError: () => {
      toast.add({
        title: "Error creating label",
        description: "An unexpected error occurred.",
        type: "error",
      });
    },
    onSettled: () => {
      reset();
      setDialogOpen(false);
    }
  });

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger
        render={(props) => (
          <Button {...props} className="gap-2 rounded-lg font-medium shrink-0">
            <Plus className="size-4" />
            <span>Add Label</span>
          </Button>
        )}
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="card-heading">Add New Label</DialogTitle>
          <DialogDescription className="card-subheading">
            Fill in the details below to create a new task label.
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
                  <Input id="name" placeholder="e.g. Bug, Feature, Urgent" {...field} />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
            <Controller
              name="description"
              control={control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="description">Description (optional)</FieldLabel>
                  <Input id="description" placeholder="Brief description of this label" {...field} />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
            <Controller
              name="colorKey"
              control={control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="add-label-color">Color</FieldLabel>
                  <ColorSelect
                    id="add-label-color"
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
          <Button type="button" variant="outline" onClick={() => reset()} className="rounded-xl h-9 px-4 text-xs font-medium">Reset</Button>
          <Button type="submit" form="add-task-label-form" disabled={isLoading} className="rounded-xl h-9 px-4 text-xs font-semibold shadow-xs">
            <Loader2Icon className={`mr-2 h-4 w-4 animate-spin ${isLoading ? "inline-block" : "hidden"}`} />
            {isLoading ? "Creating..." : "Create Label"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
