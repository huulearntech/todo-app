import { z } from "zod";
import { hexCodeSchema, colorResponseSchema } from "./color.schema.js";

export const createTaskLabelSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  colorHexCode: hexCodeSchema.optional(),
});

export type CreateTaskLabelDto = z.infer<typeof createTaskLabelSchema>;

export const updateTaskLabelSchema = z.object({
  id: z.uuid("Invalid UUID format"),
  name: z.string().min(1, "Name is required").optional(),
  description: z.string().optional(),
  colorHexCode: hexCodeSchema.optional(),
});

export type UpdateTaskLabelDto = z.infer<typeof updateTaskLabelSchema>;

export const taskLabelResponseSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  description: z.string().optional(),
  colorHexCode: z.string(),
  color: colorResponseSchema.optional(),
});

export type TaskLabelResponseDto = z.infer<typeof taskLabelResponseSchema>;