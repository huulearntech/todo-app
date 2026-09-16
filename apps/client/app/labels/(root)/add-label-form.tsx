// TODO: move this to components
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

import { createLabelSchema, type CreateLabelDto } from "@todo/shared";


export default function Dialog_AddLabel() {
  const queryClient = useQueryClient();

  const [dialogOpen, setDialogOpen] = useState(false);

  const { control, handleSubmit, formState: { errors }, reset } = useForm<CreateLabelDto>({
    resolver: zodResolver(createLabelSchema),
    defaultValues: {
      name: '',
      description: '',
    },
  });

  const createLabelMutation = useMutation({
    mutationFn: (data: CreateLabelDto) => taskLabelService.createTaskLabel(data),
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

  const onSubmit = async (data: CreateLabelDto) => {
    toast.promise(
      createLabelMutation.mutateAsync(data),
      {
        loading: "Creating label...",
        success: "Label created successfully!",
        error: "Error creating label.",
      }
    );
    setDialogOpen(false);
  };

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger render={<Button variant="outline" />}>
        <Plus />
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Label</DialogTitle>
          <DialogDescription>
            Fill in the details below to create a new label.
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
          <Button type="button" variant="outline" onClick={() => reset()}>Reset</Button>
          <Button type="submit" form="add-task-label-form">Add Label</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
