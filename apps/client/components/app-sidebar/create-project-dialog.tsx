"use client";

import * as React from "react";
import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { PlusIcon, Loader2Icon } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Field,
  FieldLabel,
  FieldError,
} from "@/components/ui/field";
import { SidebarMenuButton } from "@/components/ui/sidebar";
import { toast } from "@/components/ui/toast";
import { createProjectSchema, CreateProjectDto } from "@todo/shared";
import { projectService } from "@/services/project.service";

export default function CreateProjectDialog() {
  const [dialogOpen, setDialogOpen] = useState(false);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateProjectDto>({
    resolver: zodResolver(createProjectSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  const createProjectMutation = useMutation({
    mutationFn: (data: CreateProjectDto) => projectService.createProject(data),
    onSuccess: (_data, _variables, _onMutateResult, context) => {
      context.client.invalidateQueries({ queryKey: ["projects"] });
      toast.add({
        title: "Project created",
        description: "Your project has been created successfully.",
        type: "success",
      });
      reset();
      setDialogOpen(false);
    },
    onError: (error) => {
      toast.add({
        title: "Error creating project",
        description: error instanceof Error ? error.message : "An unknown error occurred.",
        type: "error",
      });
    },
  });

  const onSubmit = (data: CreateProjectDto) => createProjectMutation.mutate(data);

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger
        render={
          <SidebarMenuButton
            tooltip="Add project"
            className="text-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
          />
        }
      >
        <PlusIcon className="size-4 shrink-0 text-muted-foreground" />
        <span>Add project</span>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md rounded-2xl p-6">
        <DialogHeader className="space-y-1 text-left">
          <DialogTitle className="text-lg font-semibold tracking-tight">
            Add project
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Create a new project to organize your tasks.
          </DialogDescription>
        </DialogHeader>

        <form
          id="create-project-form"
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-4 pt-2"
        >
          <Controller
            name="name"
            control={control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid} className="space-y-1.5">
                <FieldLabel htmlFor="create-project-name" className="text-xs font-semibold text-foreground">
                  Name
                </FieldLabel>
                <Input
                  {...field}
                  id="create-project-name"
                  placeholder="e.g., Work, Personal, Shopping"
                  className="h-9 rounded-xl border-border/70 text-sm font-medium focus-visible:ring-2 focus-visible:ring-primary/40"
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
                <FieldLabel htmlFor="create-project-desc" className="text-xs font-semibold text-foreground">
                  Description <span className="text-muted-foreground font-normal">(Optional)</span>
                </FieldLabel>
                <Input
                  {...field}
                  id="create-project-desc"
                  placeholder="Short description of this project..."
                  className="h-9 rounded-xl border-border/70 text-sm font-medium focus-visible:ring-2 focus-visible:ring-primary/40"
                />
                {fieldState.error && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />

          <DialogFooter className="flex items-center justify-end gap-2 pt-3 border-t border-border/40">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setDialogOpen(false)}
              className="rounded-xl h-8 px-4 text-xs font-medium"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={createProjectMutation.isPending}
              className="rounded-xl h-8 px-4 text-xs font-semibold shadow-xs"
            >
              {createProjectMutation.isPending ? (
                <>
                  <Loader2Icon className="size-3.5 animate-spin mr-1.5" />
                  Creating...
                </>
              ) : (
                "Add project"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}