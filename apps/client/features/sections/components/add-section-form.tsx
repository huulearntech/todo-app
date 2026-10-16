"use client";

import * as React from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useCreateSection } from "@/features/sections/hooks/use-create-section";
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
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

import {
  createSectionSchema,
  type CreateSectionDto,
} from "@todo/shared";

export interface AddSectionFormProps {
  projectId: string;
  className?: string;
}

export interface AddSectionFormHandle {
  focus: () => void;
  scrollIntoView: () => void;
}

const AddSectionForm = React.forwardRef<AddSectionFormHandle, AddSectionFormProps>(
  function AddSectionForm({ projectId, className }, ref) {
    const inputRef = React.useRef<HTMLInputElement | null>(null);

    React.useImperativeHandle(ref, () => ({
      focus: () => {
        inputRef.current?.focus();
      },
      scrollIntoView: () => {
        inputRef.current?.scrollIntoView({
          behavior: "smooth",
          inline: "end",
          block: "nearest",
        });
      },
    }));

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
        colorKey: "slate",
      },
    });

    const sectionName = watch("name");

    const addSectionMutation = useCreateSection(projectId);

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
      <Card
        className={cn(
          "mb-2.5 w-full bg-transparent ring-0 ring-transparent border border-dashed border-foreground/50 shadow-none",
          className
        )}
      >
        <CardHeader className="flex items-center justify-between">
          <span className="item-title">
            New Section
          </span>
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
                    <Input
                      {...field}
                      ref={(node) => {
                        field.ref(node);
                        inputRef.current = node;
                      }}
                      id="section-name"
                      placeholder="Section Name"
                      disabled={addSectionMutation.isPending}
                      className="bg-background shadow-2xs"
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
                disabled={addSectionMutation.isPending || !sectionName?.trim()}
                className="flex flex-1 h-9 rounded-xl text-xs font-semibold shadow-xs items-center gap-2"
              >
                <PlusIcon className="size-4" />
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
                  disabled={addSectionMutation.isPending}
                  onClick={() => reset({ projectId, name: "", description: "" })}
                  className="h-9 px-3 text-xs text-muted-foreground hover:text-foreground rounded-xl"
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
);

AddSectionForm.displayName = "AddSectionForm";

export default AddSectionForm;