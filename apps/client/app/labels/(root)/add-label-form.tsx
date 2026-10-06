// TODO: move this to components
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
import { Loader2Icon, Plus } from "lucide-react";

import { createTaskLabelSchema, TaskLabelResponseDto, type CreateTaskLabelDto } from "@todo/shared";


export default function Dialog_AddLabel() {
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: colors = [] } = useQuery({
    queryKey: ["colors"],
    queryFn: colorService.getMyColors,
  });

  const { control, handleSubmit, reset, formState: { isLoading } } = useForm<CreateTaskLabelDto>({
    resolver: zodResolver(createTaskLabelSchema),
    defaultValues: {
      name: '',
      description: '',
      colorHexCode: '#E0E0E0',
    },
  });

  const createLabelMutation = useMutation({
    mutationFn: (data: CreateTaskLabelDto) => taskLabelService.createTaskLabel(data),

    onMutate: async (newLabel, context) => {
      await context.client.cancelQueries({ queryKey: ["task-labels"] });

      const previousTaskLabels = context.client.getQueryData<TaskLabelResponseDto[]>(["task-labels"]);

      context.client.setQueryData(["task-labels"], (oldTaskLabels: TaskLabelResponseDto[] | undefined) => {
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
      <DialogTrigger
        render={(props) => (
          <Button {...props} className="gap-2 rounded-lg font-medium shrink-0">
            <Plus className="size-4" />
            <span>Add Label</span>
          </Button>
        )}
      />
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Label</DialogTitle>
          <DialogDescription>
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
              name="colorHexCode"
              control={control}
              render={({ field, fieldState }) => {
                const selectedColor = colors.find(
                  (c) => c.hexCode.toUpperCase() === field.value?.toUpperCase(),
                );
                return (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="add-label-color">Color</FieldLabel>
                    <Select
                      id="add-label-color"
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
          <Button type="button" variant="outline" onClick={() => reset()} className="rounded-lg">Reset</Button>
          <Button type="submit" form="add-task-label-form" disabled={isLoading} className="rounded-lg">
            <Loader2Icon className={`mr-2 h-4 w-4 animate-spin ${isLoading ? "inline-block" : "hidden"}`} />
            {isLoading ? "Creating..." : "Create Label"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
