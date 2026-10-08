"use client";


import { useRef } from "react";
import { useHotkey } from "@tanstack/react-hotkeys";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { createTaskSchema, TaskPriority, type CreateTaskDto } from "@todo/shared";


import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function AddQuickTaskForm() {
  const taskInputRef = useRef<HTMLInputElement>(null);
  useHotkey("Q", () => {
    taskInputRef.current?.focus();
  });

  const { handleSubmit } = useForm<CreateTaskDto>({
    resolver: zodResolver(createTaskSchema),
    defaultValues: { // NOTE:
      title: "",
      description: "",
      timeRange: null,
      priority: TaskPriority.HIGH,
    },
  });

  const onSubmit = (data: CreateTaskDto) => {
    // TODO:
    console.log(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex items-center gap-2 mb-4">
      <Input
        ref={taskInputRef}
        type="text"
        placeholder="Add a quick task..."
        className="w-full"
      />
      <Button
        type="submit"
        className="shrink-0 rounded-xl"
      >
        Add Task
      </Button>
    </form>
  );
}