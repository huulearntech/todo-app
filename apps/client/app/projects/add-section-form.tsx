"use client";

import * as React from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { PlusIcon, Loader2Icon } from "lucide-react";

import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

import { sectionService } from "@/services/section.service";
import {
  createSectionSchema,
  type SectionResponseDto,
  type CreateSectionDto,
} from "@todo/shared";

export interface AddSectionFormProps {
  projectId: string;
  className?: string;
}

export default function AddSectionForm({
  projectId,
  className,
}: AddSectionFormProps) {
  const {
    control,
    handleSubmit,
    reset,
    watch,
  } = useForm<CreateSectionDto>({
    resolver: zodResolver(createSectionSchema),
    defaultValues: {
      projectId,
      name: "",
      description: "",
    },
  });

  const sectionName = watch("name");

  const addSectionMutation = useMutation({
    mutationFn: (data: CreateSectionDto) => sectionService.createSection(data),
    onMutate: async (newSection, context) => {
      await context.client.cancelQueries({ queryKey: ["sections", { projectId }] });

      const previousSections = context.client.getQueryData<SectionResponseDto[]>([
        "sections",
        { projectId },
      ]);

      context.client.setQueryData(
        ["sections", { projectId }],
        (oldSections: SectionResponseDto[] | undefined) => [
          ...(oldSections || []),
          {
            ...newSection,
            id: `temp-${Date.now()}`,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ]
      );

      return { previousSections };
    },
    onError: (_err, _newSection, onMutateResult, context) => {
      if (onMutateResult?.previousSections) {
        context.client.setQueryData(
          ["sections", { projectId }],
          onMutateResult.previousSections
        );
      }
    },
    onSettled: (_data, _error, _variables, _onMutateResult, context) => {
      context.client.invalidateQueries({ queryKey: ["sections", { projectId }] });
    },
  });

  const onSubmit = (data: CreateSectionDto) => {
    addSectionMutation.mutate(data, {
      onSuccess: () => {
        toast.add({
          title: "Section created",
          description: `"${data.name}" section has been created.`,
          type: "success",
        });
        reset({ projectId, name: "", description: "" });
      },
      onError: (err) => {
        toast.add({
          title: "Error creating section",
          description:
            err instanceof Error ? err.message : "An unexpected error occurred.",
          type: "error",
        });
      },
    });
  };

  return (
    <Card className={cn("mb-2.5 w-full bg-card shadow-xs", className)}>
      <CardHeader className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <PlusIcon className="size-4 text-muted-foreground" />
          <span className="text-sm font-semibold text-foreground">
            Add Section
          </span>
        </div>
      </CardHeader>

      <CardContent>
        <form
          id="add-section-form"
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-3"
        >
          <FieldGroup>
            <Controller
              name="name"
              control={control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid} className="space-y-1.5">
                  <FieldLabel
                    htmlFor="section-name"
                    className="text-xs font-medium text-muted-foreground"
                  >
                    Section Name
                  </FieldLabel>
                  <Input
                    {...field}
                    id="section-name"
                    placeholder="e.g. In Review, QA..."
                    disabled={addSectionMutation.isPending}
                    className="h-9 rounded-lg border-border/70 text-sm font-medium focus-visible:ring-2 focus-visible:ring-primary/30"
                  />
                  {fieldState.error && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
          </FieldGroup>

          <div className="flex items-center gap-2 pt-1">
            <Button
              type="submit"
              size="sm"
              disabled={addSectionMutation.isPending || !sectionName?.trim()}
              className="flex-1 h-8 rounded-lg text-xs font-semibold shadow-xs"
            >
              {addSectionMutation.isPending ? (
                <>
                  <Loader2Icon className="size-3.5 animate-spin mr-1.5" />
                  Adding Section...
                </>
              ) : (
                "Add Section"
              )}
            </Button>

            {sectionName && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={addSectionMutation.isPending}
                onClick={() => reset({ projectId, name: "", description: "" })}
                className="h-8 px-2.5 text-xs text-muted-foreground hover:text-foreground"
              >
                Clear
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}