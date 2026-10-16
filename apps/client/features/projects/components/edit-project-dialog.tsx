"use client";

import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useUpdateProject } from "@/features/projects/hooks/use-update-project";
import { Loader2Icon } from "lucide-react";
import { ColorSelect } from "@/components/ui/color-select";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import { updateProjectSchema, type UpdateProjectDto, type ProjectResponseDto as Project } from "@todo/shared";

export interface EditProjectDialogProps {
  project: Project;
  onClose: () => void;
}

export default function EditProjectDialog({
  project,
  onClose,
}: EditProjectDialogProps) {
  const [open, setOpen] = useState(true);

  const {
    control,
    handleSubmit,
  } = useForm<UpdateProjectDto>({
    resolver: zodResolver(updateProjectSchema),
    defaultValues: {
      name: project.name,
      description: project.description || "",
      colorKey: project.colorKey || "slate",
    },
  });

  const updateProjectMutation = useUpdateProject();

  const onSubmit = (data: UpdateProjectDto) => {
    updateProjectMutation.mutate(
      { projectId: project.id, data },
      {
        onSuccess: (_res, variables) => {
          const updatedName = "name" in variables ? variables.name : project.name;
          toast.add({
            title: "Project updated",
            description: `"${updatedName || project.name}" has been updated successfully.`,
            type: "success",
          });
          setOpen(false);
        },
        onError: (err) => {
          toast.add({
            title: "Error updating project",
            description: err instanceof Error ? err.message : "An unexpected error occurred.",
            type: "error",
          });
        },
      }
    );
  };

  return (
    <Dialog
      open={open}
      onOpenChange={setOpen}
      onOpenChangeComplete={(isOpen) => {
        if (!isOpen) onClose();
      }}
    >
      <DialogContent className="sm:max-w-md rounded-2xl p-6">
        <DialogHeader className="space-y-1 text-left">
          <DialogTitle className="card-heading">
            Edit Project
          </DialogTitle>
          <DialogDescription className="card-subheading">
            Update project details, description, or color.
          </DialogDescription>
        </DialogHeader>

        <form
          id="edit-project-dialog-form"
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-4 pt-2"
        >
          <FieldGroup className="space-y-3.5">
            <Controller
              name="name"
              control={control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid} className="space-y-1.5">
                  <FieldLabel htmlFor="edit-project-name" className="text-xs font-semibold text-foreground">
                    Project name
                  </FieldLabel>
                  <Input
                    {...field}
                    id="edit-project-name"
                    placeholder="e.g. Website Redesign, Marketing"
                    disabled={updateProjectMutation.isPending}
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
                  <FieldLabel htmlFor="edit-project-description" className="text-xs font-semibold text-foreground">
                    Description <span className="text-muted-foreground font-normal">(Optional)</span>
                  </FieldLabel>
                  <Input
                    {...field}
                    id="edit-project-description"
                    placeholder="Brief description or purpose of this project..."
                    disabled={updateProjectMutation.isPending}
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
                  <FieldLabel htmlFor="edit-project-color" className="text-xs font-semibold text-foreground">
                    Color
                  </FieldLabel>
                  <ColorSelect
                    id="edit-project-color"
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={updateProjectMutation.isPending}
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
              disabled={updateProjectMutation.isPending}
              onClick={() => setOpen(false)}
              className="rounded-xl h-9 px-4 text-xs font-medium"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={updateProjectMutation.isPending}
              className="rounded-xl h-9 px-4 text-xs font-semibold shadow-xs"
            >
              {updateProjectMutation.isPending ? (
                <>
                  <Loader2Icon className="size-3.5 animate-spin mr-1.5" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
