import { z } from "zod";

export const createTaskLabelSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
});

export type CreateTaskLabelDto = z.infer<typeof createTaskLabelSchema>;

export const updateTaskLabelSchema = z.object({
  id: z.uuid("Invalid UUID format"),
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
});

export type UpdateTaskLabelDto = z.infer<typeof updateTaskLabelSchema>;