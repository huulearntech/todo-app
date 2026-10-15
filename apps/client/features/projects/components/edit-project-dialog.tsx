"use client";

import { useEffect } from "react";
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
import { updateProjectSchema, type UpdateProjectDto } from "@todo/shared";
import { useEditProjectDialog } from "@/features/projects/context/edit-project-context";

export default function EditProjectDialog() {
  const { projectToEdit, isOpen, closeEditProjectDialog } = useEditProjectDialog();

  const {
    control,
    handleSubmit,
    reset,
  } = useForm<UpdateProjectDto>({
    resolver: zodResolver(updateProjectSchema),
    defaultValues: {
      name: "",
      description: "",
      colorKey: "slate",
    },
  });

  useEffect(() => {
    if (projectToEdit) {
      reset({
        name: projectToEdit.name,
        description: projectToEdit.description || "",
        colorKey: projectToEdit.colorKey || "slate",
      });
    }
  }, [projectToEdit, reset]);

  const updateProjectMutation = useUpdateProject();

  const onSubmit = (data: UpdateProjectDto) => {
    if (!projectToEdit) return;
    updateProjectMutation.mutate(
      { projectId: projectToEdit.id, data },
      {
        onSuccess: (_res, variables) => {
          const updatedName = "name" in variables ? variables.name : projectToEdit?.name;
          toast.add({
            title: "Project updated",
            description: `"${updatedName || projectToEdit?.name}" has been updated successfully.`,
            type: "success",
          });
          closeEditProjectDialog();
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
    <Dialog open={isOpen} onOpenChange={(open) => !open && closeEditProjectDialog()}>
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
              onClick={closeEditProjectDialog}
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
