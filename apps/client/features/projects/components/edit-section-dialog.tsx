"use client";

import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useColors } from "@/hooks/colors/use-colors";
import { useUpdateSection } from "@/features/projects/hooks/use-update-section";
import { Loader2Icon } from "lucide-react";
import { getColorConfig } from "@/lib/color-palette";

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
import { updateSectionSchema, type UpdateSectionDto, type SectionResponseDto, type PaletteColor } from "@todo/shared";

export interface EditSectionDialogProps {
  projectId: string;
  section: SectionResponseDto | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function EditSectionDialog({
  projectId,
  section,
  open,
  onOpenChange,
}: EditSectionDialogProps) {
  const { data: colors = [] } = useColors();

  const {
    control,
    handleSubmit,
    reset,
  } = useForm<UpdateSectionDto>({
    resolver: zodResolver(updateSectionSchema),
    defaultValues: {
      name: "",
      description: "",
      colorKey: "slate",
    },
  });

  useEffect(() => {
    if (section) {
      reset({
        name: section.name,
        description: section.description || "",
        colorKey: (section.colorKey as PaletteColor) || "slate",
      });
    }
  }, [section, reset]);

  const updateSectionMutation = useUpdateSection(projectId);

  const onSubmit = (data: UpdateSectionDto) => {
    if (!section) return;

    updateSectionMutation.mutate(
      { sectionId: section.id, data },
      {
        onSuccess: (_res, variables) => {
          const updatedName = variables.data.name || section.name;
          toast.add({
            title: "Section updated",
            description: `"${updatedName}" has been updated successfully.`,
            type: "success",
          });
          onOpenChange(false);
        },
        onError: (err) => {
          toast.add({
            title: "Error updating section",
            description: err instanceof Error ? err.message : "An unexpected error occurred.",
            type: "error",
          });
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-2xl p-6">
        <DialogHeader className="space-y-1 text-left">
          <DialogTitle className="card-heading">
            Edit Section
          </DialogTitle>
          <DialogDescription className="card-subheading">
            Update section name, description, or color.
          </DialogDescription>
        </DialogHeader>

        <form
          id="edit-section-dialog-form"
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-4 pt-2"
        >
          <FieldGroup className="space-y-3.5">
            <Controller
              name="name"
              control={control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid} className="space-y-1.5">
                  <FieldLabel htmlFor="edit-section-name" className="text-xs font-semibold text-foreground">
                    Section name
                  </FieldLabel>
                  <Input
                    {...field}
                    id="edit-section-name"
                    placeholder="e.g. In Progress, Backlog"
                    disabled={updateSectionMutation.isPending}
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
                  <FieldLabel htmlFor="edit-section-description" className="text-xs font-semibold text-foreground">
                    Description <span className="text-muted-foreground font-normal">(Optional)</span>
                  </FieldLabel>
                  <Input
                    {...field}
                    id="edit-section-description"
                    placeholder="Brief description of this section..."
                    disabled={updateSectionMutation.isPending}
                  />
                  {fieldState.error && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />

            <Controller
              name="colorKey"
              control={control}
              render={({ field, fieldState }) => {
                const selectedColor = colors.find(
                  (c) => c.key === field.value
                );
                const selectedConfig = getColorConfig(field.value);

                return (
                  <Field data-invalid={fieldState.invalid} className="space-y-1.5">
                    <FieldLabel htmlFor="edit-section-color" className="text-xs font-semibold text-foreground">
                      Color
                    </FieldLabel>
                    <Select
                      id="edit-section-color"
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
              disabled={updateSectionMutation.isPending}
              onClick={() => onOpenChange(false)}
              className="rounded-xl h-9 px-4 text-xs font-medium"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={updateSectionMutation.isPending}
              className="rounded-xl h-9 px-4 text-xs font-semibold shadow-xs"
            >
              {updateSectionMutation.isPending ? (
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
