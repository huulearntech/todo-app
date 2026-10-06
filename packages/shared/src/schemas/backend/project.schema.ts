import { z } from "zod";
import { hexCodeSchema, colorResponseSchema } from "./color.schema.js";

export const createProjectSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  colorHexCode: hexCodeSchema.optional(),
});

export type CreateProjectDto = z.infer<typeof createProjectSchema>;

export const updateProjectSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string(),
  colorHexCode: hexCodeSchema,
}).partial();

export type UpdateProjectDto = z.infer<typeof updateProjectSchema>;


export const projectResponseSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  description: z.string().optional(),
  colorHexCode: z.string(),
  color: colorResponseSchema.optional(),
});

export type ProjectResponseDto = z.infer<typeof projectResponseSchema>;


export const projectFilterSchema = z.object({
  name: z.string(),
  isDefault: z.stringbool(),
}).partial();

export type ProjectFilterDto = z.infer<typeof projectFilterSchema>;