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

import { createProjectSchema, CreateProjectDto, ProjectResponseDto } from "@todo/shared"
import { projectService } from "@/services/project.service"
import { PlusIcon } from "lucide-react";
import { SidebarMenuButton } from "../ui/sidebar";
import { useMutation } from "@tanstack/react-query";
import { toast } from "../ui/toast";
import { useState } from "react";

export default function CreateProjectDialog() {
  const [dialogOpen, setDialogOpen] = useState(false);

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

  const createProjectMutation = useMutation({
    mutationFn: (data: CreateProjectDto) => projectService.createProject(data),
    onSuccess: (_data, _variables, _onMutateResult, context) => {
      context.client.invalidateQueries({ queryKey: ["projects"] })
      toast.add({
        title: "Project created",
        description: "Your project has been created successfully.",
        type: "success",
      })
    },
    onError: (error) => {
      toast.add({
        title: "Error creating project",
        description: error instanceof Error ? error.message : "An unknown error occurred.",
        type: "error",
      })
    },
    onSettled: () => {
      setDialogOpen(false)
    }
  })

  const onSubmit = (data: CreateProjectDto) => createProjectMutation.mutate(data)


  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
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

        <form
          id="create-project-form"
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-4"
        >
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
      </DialogContent>
    </Dialog>
  );
}