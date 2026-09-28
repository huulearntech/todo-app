"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Field,
  FieldLabel,
  FieldError,
} from "@/components/ui/field"

import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"

import { createProjectSchema, CreateProjectDto } from "@todo/shared"
import { projectService } from "@/services/project.service"
import { PlusIcon } from "lucide-react";
import { SidebarMenuButton } from "../ui/sidebar";

export default function CreateProjectDialog() {
  return (
    <Dialog>
      <DialogTrigger render={<SidebarMenuButton />}>
        <PlusIcon />
        New Project
      </DialogTrigger>

      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create Project</DialogTitle>
          <DialogDescription>
            Create a new project to organize your tasks.
          </DialogDescription>
        </DialogHeader>

        <CreateProjectForm />
      </DialogContent>
    </Dialog>
  );
}


function CreateProjectForm() {
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateProjectDto>({
    resolver: zodResolver(createProjectSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  })

  const onSubmit = async (data: CreateProjectDto) => {
    await projectService.createProject(data)
  }

  return (
    <form
      id="create-project-form"
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-4"
    >
      {/* <Controller
        name="name"
        control={control}
        render={({ field, fieldState }) => (
          <Field>
            <FieldLabel>Name</FieldLabel>
            <Input {...field} />
            <FieldError errors={[fieldState.error]} />
          </Field>
        )}
      /> */}

      <Controller
        name="name"
        control={control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor="name">Name</FieldLabel>
            <Input {...field} placeholder="Name" />
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />

      <Controller
        name="description"
        control={control}
        render={({ field, fieldState }) => (
          <Field>
            <FieldLabel>Description</FieldLabel>
            <Input {...field} />
            <FieldError errors={[fieldState.error]} />
          </Field>
        )}
      />

      <Button type="submit" form="create-project-form">Create Project</Button>
    </form>
  )
}