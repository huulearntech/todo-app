// TODO: move this to components
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

import { taskLabelService } from "@/services/task-label.service";

const labelSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
});

type LabelFormData = z.infer<typeof labelSchema>;


export default function AddLabelForm() {

  const { control, handleSubmit, formState: { errors }, reset } = useForm<LabelFormData>({
    resolver: zodResolver(labelSchema),
    defaultValues: {
      name: '',
      description: '',
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add Label</CardTitle>
        <CardDescription>Fill in the details for the new label.</CardDescription>
      </CardHeader>
      <CardContent>
        <form
          id="add-task-label-form"
          onSubmit={handleSubmit(taskLabelService.createTaskLabel)}
        >
          <FieldGroup>
            <Controller
              name="name"
              control={control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="name">Name</FieldLabel>
                  <Input id="name" {...field} />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
            <Controller
              name="description"
              control={control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="description">Description</FieldLabel>
                  <Input id="description" {...field} />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
          </FieldGroup>
        </form>
      </CardContent>

      <CardFooter>
        <Button type="button" variant="outline" onClick={() => reset()}>Reset</Button>
        <Button type="submit" form="add-task-label-form">Add Label</Button>
      </CardFooter>

    </Card>
  );
}
