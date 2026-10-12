import { z } from "zod";
import { colorKeySchema, colorResponseSchema } from "./color.schema.js";

export const createTaskLabelSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Name is required")
    .max(100, "Name must be at most 100 characters long"),
  description: z
    .string()
    .max(10_000, "Description must be at most 10000 characters")
    .optional(),
  colorKey: colorKeySchema.optional(),
});

export type CreateTaskLabelDto = z.infer<typeof createTaskLabelSchema>;

export const updateTaskLabelSchema = createTaskLabelSchema.partial();

export type UpdateTaskLabelDto = z.infer<typeof updateTaskLabelSchema>;

export const taskLabelResponseSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  description: z.string().optional(),
  colorKey: colorKeySchema.optional(),
  color: colorResponseSchema.optional(),
});

export type TaskLabelResponseDto = z.infer<typeof taskLabelResponseSchema>;