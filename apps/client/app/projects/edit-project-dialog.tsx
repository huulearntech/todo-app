"use client";

import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2Icon } from "lucide-react";

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

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { projectService } from "@/services/project.service";
import { colorService } from "@/services/color.service";
import { updateProjectSchema, type UpdateProjectDto } from "@todo/shared";
import { useEditProjectDialog } from "@/providers/EditProjectProvider";

// Fuck AI bullshit
export default function EditProjectDialog() {
  const { projectToEdit, isOpen, closeEditProjectDialog } = useEditProjectDialog();
  const queryClient = useQueryClient();

  const { data: colors = [] } = useQuery({
    queryKey: ["colors"],
    queryFn: colorService.getMyColors,
  });

  const {
    control,
    handleSubmit,
    reset,
  } = useForm<UpdateProjectDto>({
    resolver: zodResolver(updateProjectSchema),
    defaultValues: {
      name: "",
      description: "",
      colorHexCode: "#E0E0E0",
    },
  });

  // NOTE: WTF?
  useEffect(() => {
    if (projectToEdit) {
      reset({
        name: projectToEdit.name,
        description: projectToEdit.description || "",
        colorHexCode: projectToEdit.colorHexCode || "#E0E0E0",
      });
    }
  }, [projectToEdit, reset]);

  const updateProjectMutation = useMutation({
    // TODO: fix this "!", because shitty AI have all the basic code wrong, I have to temporarily patch it here.
    mutationFn: (data: UpdateProjectDto) => projectService.updateProject(projectToEdit!.id, data),
    onSuccess: (res, variables) => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      toast.add({
        title: "Project updated",
        description: `"${variables.name || projectToEdit?.name}" has been updated successfully.`,
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
  });

  const onSubmit = (data: UpdateProjectDto) => {
    if (!projectToEdit) return;
    updateProjectMutation.mutate(data);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && closeEditProjectDialog()}>
      <DialogContent className="sm:max-w-md rounded-2xl p-6">
        <DialogHeader className="space-y-1 text-left">
          <DialogTitle className="text-lg font-semibold tracking-tight text-foreground">
            Edit Project
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
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
                  <FieldLabel htmlFor="edit-project-description" className="text-xs font-semibold text-foreground">
                    Description <span className="text-muted-foreground font-normal">(Optional)</span>
                  </FieldLabel>
                  <Input
                    {...field}
                    id="edit-project-description"
                    placeholder="Brief description or purpose of this project..."
                    disabled={updateProjectMutation.isPending}
                    className="h-9 rounded-xl border-border/70 text-sm font-medium focus-visible:ring-2 focus-visible:ring-primary/40"
                  />
                  {fieldState.error && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />

            <Controller
              name="colorHexCode"
              control={control}
              render={({ field, fieldState }) => {
                const selectedColor = colors.find(
                  (c) => c.hexCode.toUpperCase() === field.value?.toUpperCase()
                );
                return (
                  <Field data-invalid={fieldState.invalid} className="space-y-1.5">
                    <FieldLabel htmlFor="edit-project-color" className="text-xs font-semibold text-foreground">
                      Color
                    </FieldLabel>
                    <Select
                      id="edit-project-color"
                      value={field.value}
                      onValueChange={field.onChange}
                    >
                      <SelectTrigger className="w-full h-9 rounded-xl border-border/70 bg-background/80 hover:bg-background transition-colors text-xs font-medium">
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
                    {fieldState.error && <FieldError errors={[fieldState.error]} />}
                  </Field>
                );
              }}
            />
          </FieldGroup>

          <DialogFooter className="flex items-center justify-end gap-2 pt-3 border-t border-border/40">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={updateProjectMutation.isPending}
              onClick={closeEditProjectDialog}
              className="rounded-xl h-8 px-4 text-xs font-medium"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={updateProjectMutation.isPending}
              className="rounded-xl h-8 px-4 text-xs font-semibold shadow-xs"
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
