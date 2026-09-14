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

import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { projectService } from "@/services/project.service";

const projectSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
});

type ProjectFormData = z.infer<typeof projectSchema>;

export default function AddProjectForm() {
  const { control, handleSubmit, formState: { errors }, reset } = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      name: '',
      description: '',
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add Project</CardTitle>
        <CardDescription>Fill in the details for the new project.</CardDescription>
      </CardHeader>
      <CardContent>
        <form
          id="add-project-form"
          onSubmit={handleSubmit(projectService.createProject)}
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
            <Controller
              name="description"
              control={control}
              render={({ field }) => (
                <Field>
                  <FieldLabel>Description</FieldLabel>
                  <Input {...field} />
                  {errors.description && <FieldError>{errors.description.message}</FieldError>}
                </Field>
              )}
            />
          </FieldGroup>
        </form>
      </CardContent>

      <CardFooter>
        <Button type="button" variant="outline" onClick={() => reset()}>Reset</Button>
        <Button type="submit" form="add-project-form">Add Project</Button>
      </CardFooter>

    </Card>
  );
}