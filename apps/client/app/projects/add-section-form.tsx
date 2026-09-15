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

import { sectionService } from "@/services/section.service";

const sectionSchema = z.object({
  name: z.string().min(1, "Name is required"),
});

type SectionFormData = z.infer<typeof sectionSchema>;

export default function AddSectionForm({ projectId }: { projectId: string }) {
  const { control, handleSubmit, formState: { errors }, reset } = useForm<SectionFormData>({
    resolver: zodResolver(sectionSchema),
    defaultValues: {
      name: '',
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add Section</CardTitle>
        <CardDescription>Fill in the details for the new section.</CardDescription>
      </CardHeader>
      <CardContent>
        <form
          id="add-section-form"
          onSubmit={handleSubmit((data) => sectionService.createSection({ projectId, ...data }).then(() => reset()))}
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