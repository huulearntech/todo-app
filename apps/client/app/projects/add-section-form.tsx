"use client";

import { Controller, useForm } from "react-hook-form";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

import { zodResolver } from "@hookform/resolvers/zod";

import { sectionService } from "@/services/section.service";
import { createSectionSchema, type CreateSectionDto } from "@todo/shared";
import { toast } from "@/components/ui/toast";

import { useMutation } from "@tanstack/react-query";


export default function AddSectionForm({ projectId }: { projectId: string }) {
  const { control, handleSubmit, formState: { errors }, reset } = useForm<CreateSectionDto>({
    resolver: zodResolver(createSectionSchema),
    defaultValues: {
      projectId,
      name: '',
      description: '',
    },
  });

  const addSectionMutation = useMutation({
    mutationFn: (data: CreateSectionDto) => sectionService.createSection(data),
    onMutate: async (newSection, context) => {
      await context.client.cancelQueries({ queryKey: ["sections", { projectId }] });

      const previousSections = context.client.getQueryData(["sections", { projectId }]);

      context.client.setQueryData(["sections", { projectId }], (oldSections: any) => {
        return [...(oldSections || []), newSection];
      });

      return { previousSections };
    },
    onError: (_err, _newSection, onMutateResult, context) => {
      // Rollback to the previous sections if there was an error
      if (onMutateResult?.previousSections) {
        context.client.setQueryData(["sections", { projectId }], onMutateResult.previousSections);
      }
    },
    onSettled: (_data, _error, _variables, _onMutateResult, context) => {
      // Invalidate the sections query to refetch the data
      context.client.invalidateQueries({ queryKey: ["sections", { projectId }] });
    },
  });

  const onSubmit = (data: CreateSectionDto) => {
    addSectionMutation.mutate(data, {
      onSuccess: () => {
        toast.add({
          title: "Section created",
          description: "The section was created successfully.",
          type: "success",
        });
      },
      onError: () => {
        toast.add({
          title: "Error creating section",
          description: "An unexpected error occurred.",
          type: "error",
        });
      },
      onSettled: () => {
        reset();
      }
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add Section</CardTitle>
        <CardDescription>Fill in the details for the new section.</CardDescription>
      </CardHeader>
      <CardContent>
        <form
          id="add-section-form"
          onSubmit={handleSubmit(onSubmit)}
        >
          <FieldGroup>
            <Controller
              name="name"
              control={control}
              render={({ field }) => (
                <Field>
                  <FieldLabel>Name</FieldLabel>
                  <Input {...field} />
                  {errors.name && <FieldError>{errors.name.message}</FieldError>}
                </Field>
              )}
            />
          </FieldGroup>
        </form>
      </CardContent>
      <CardFooter>
        <Button type="submit" form="add-section-form">Add Section</Button>
      </CardFooter>
    </Card>
  );
}