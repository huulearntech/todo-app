// TODO: move this to components
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
import { Loader2Icon, Plus } from "lucide-react";

import { createTaskLabelSchema, type CreateTaskLabelDto } from "@todo/shared";


export default function Dialog_AddLabel() {
  const [dialogOpen, setDialogOpen] = useState(false);

  const { control, handleSubmit, reset, formState: { isLoading } } = useForm<CreateTaskLabelDto>({
    resolver: zodResolver(createTaskLabelSchema),
    defaultValues: {
      name: '',
      description: '',
    },
  });

  const createLabelMutation = useMutation({
    mutationFn: (data: CreateTaskLabelDto) => taskLabelService.createTaskLabel(data),

    onMutate: async (newLabel, context) => {
      await context.client.cancelQueries({ queryKey: ["task-labels"] });

      const previousTaskLabels = context.client.getQueryData(["task-labels"]);

      context.client.setQueryData(["task-labels"], (oldTaskLabels: any) => {
        return [...(oldTaskLabels || []), newLabel];
      });

      return { previousTaskLabels };
    },

    onError: (_error, _newLabel, onMutateResult, context) => {
      if (onMutateResult?.previousTaskLabels) {
        context.client.setQueryData(["task-labels"], onMutateResult.previousTaskLabels);
      }
    },

    onSettled: (_data, _error, _variables, _onMutateResult, context) => {
      context.client.invalidateQueries({ queryKey: ["task-labels"] });
    }
  });

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
          <Button type="submit" form="add-task-label-form" disabled={isLoading}>
            <Loader2Icon className={`mr-2 h-4 w-4 animate-spin ${isLoading ? "inline-block" : "hidden"}`} />
            {isLoading ?  "Creating..." : "Create Label" }
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
