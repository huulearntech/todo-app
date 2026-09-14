"use client";


import { useRef } from "react";
import { useHotkey } from "@tanstack/react-hotkeys";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

// TODO: move
import { z } from "zod";

const taskSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  dueDate: z.date().optional(),
  priority: z.enum(["low", "medium", "high"]).optional(),
  completed: z.boolean().optional(), // NOTE: of course this should be false.
});

export default function AddQuickTaskForm() {
  const taskInputRef = useRef<HTMLInputElement>(null);
  useHotkey("Mod+K", () => {
    taskInputRef.current?.focus();
  });

  const { handleSubmit } = useForm({
    resolver: zodResolver(taskSchema),
  });

  // TODO:
  const onSubmit = (data: z.infer<typeof taskSchema>) => {
    console.log(data);
  };

  // NOTE: The form should be outside of user input.
  // because it needs to parse the input first, then adds the task to the list.

  // TODO: use shadcn component
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex items-center mb-4">
      <input
        ref={taskInputRef}
        type="text"
        placeholder="Add a quick task // TODO: may need to add a keyboard shortcut to focus on this input"
        className="border border-gray-300 rounded-md px-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      />
      <button
        type="submit"
        className="ml-2 bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      >
        Add Task
      </button>
    </form>
  );
}