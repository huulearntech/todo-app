"use client";

import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useCreateProject } from "@/features/projects/hooks/use-create-project";
import { PlusIcon, Loader2Icon } from "lucide-react";
import { ColorSelect } from "@/components/ui/color-select";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { createProjectSchema, type CreateProjectDto } from "@todo/shared";

export interface AddProjectDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode;
  onSuccess?: () => void;
}

export default function AddProjectDialog({
  open: controlledOpen,
  onOpenChange: setControlledOpen,
  trigger,
  onSuccess,
}: AddProjectDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const dialogOpen = isControlled ? controlledOpen : internalOpen;
  const setDialogOpen = isControlled ? setControlledOpen! : setInternalOpen;

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CreateProjectDto>({
    resolver: zodResolver(createProjectSchema),
    defaultValues: {
      name: "",
      description: "",
      colorKey: "slate",
    },
  });

  const createProjectMutation = useCreateProject();

  const onSubmit = (data: CreateProjectDto) => {
    createProjectMutation.mutate(data, {
      onSuccess: (_res, variables) => {
        toast.add({
          title: "Project created",
          description: `"${variables.name}" has been created successfully.`,
          type: "success",
        });
        reset();
        setDialogOpen(false);
        onSuccess?.();
      },
      onError: (err) => {
        toast.add({
          title: "Error creating project",
          description: err instanceof Error ? err.message : "An unexpected error occurred.",
          type: "error",
        });
      },
    });
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      reset();
    }
    setDialogOpen(nextOpen);
  };

  return (
    <Dialog open={dialogOpen} onOpenChange={handleOpenChange}>
      {trigger ? (
        <DialogTrigger nativeButton={false} render={(props) => <div {...props} className="inline-flex w-full">{trigger}</div>} />
      ) : (
        <DialogTrigger
          render={(props) => (
            <Button {...props} className="gap-2 rounded-xl font-medium shrink-0">
              <PlusIcon className="size-4" />
              <span>Add Project</span>
            </Button>
          )}
        />
      )}

      <DialogContent className="sm:max-w-md rounded-2xl">
        <DialogHeader className="space-y-1 text-left">
          <DialogTitle className="card-heading">
            New Project
          </DialogTitle>
          <DialogDescription className="card-subheading">
            Create a new project to organize and manage your tasks.
          </DialogDescription>
        </DialogHeader>

        <form
          id="add-project-dialog-form"
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-4 pt-2"
        >
          <FieldGroup className="space-y-3.5">
            <Controller
              name="name"
              control={control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid} className="space-y-1.5">
                  <FieldLabel htmlFor="project-name" className="text-xs font-semibold text-foreground">
                    Project name
                  </FieldLabel>
                  <Input
                    {...field}
                    id="project-name"
                    placeholder="e.g. Website Redesign, Marketing"
                    disabled={createProjectMutation.isPending}
                  />
                  {fieldState.error && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />

            <Controller
              name="description"
              control={control}
              render={({ field, fieldState }) => (
                <Field className="space-y-1.5">
                  <FieldLabel htmlFor="project-description" className="text-xs font-semibold text-foreground">
                    Description <span className="text-muted-foreground font-normal">(Optional)</span>
                  </FieldLabel>
                  <Input
                    {...field}
                    id="project-description"
                    placeholder="Brief description or purpose of this project..."
                    disabled={createProjectMutation.isPending}
                  />
                  {fieldState.error && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />

            <Controller
              name="colorKey"
              control={control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid} className="space-y-1.5">
                  <FieldLabel htmlFor="project-color" className="text-xs font-semibold text-foreground">
                    Color
                  </FieldLabel>
                  <ColorSelect
                    id="project-color"
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={createProjectMutation.isPending}
                  />
                  {fieldState.error && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
          </FieldGroup>

          <DialogFooter className="flex items-center justify-end gap-2 pt-3 border-t border-border/40">
            <Button
              type="button"
              variant="outline"
              disabled={createProjectMutation.isPending}
              onClick={() => handleOpenChange(false)}
              className="rounded-xl h-9 px-4 text-xs font-medium"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createProjectMutation.isPending}
              className="rounded-xl h-9 px-4 text-xs font-semibold shadow-xs"
            >
              {createProjectMutation.isPending ? (
                <>
                  <Loader2Icon className="size-3.5 animate-spin mr-1.5" />
                  Creating...
                </>
              ) : (
                "Create Project"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}