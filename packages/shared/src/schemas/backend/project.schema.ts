import { z } from "zod";
import { colorKeySchema, colorResponseSchema } from "./color.schema.js";

export const createProjectSchema = z.object({
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

export type CreateProjectDto = z.infer<typeof createProjectSchema>;

export const updateProjectSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Name is required")
    .max(100, "Name must be at most 100 characters long"),
  description: z
    .string()
    .max(10_000, "Description must be at most 10000 characters"),
  colorKey: colorKeySchema,
}).partial();

export type UpdateProjectDto = z.infer<typeof updateProjectSchema>;


export const projectResponseSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  description: z.string().optional(),
  colorKey: colorKeySchema.optional(),
  color: colorResponseSchema.optional(),
});

export type ProjectResponseDto = z.infer<typeof projectResponseSchema>;


export const projectFilterSchema = z.object({
  name: z.string(),
  isDefault: z.stringbool(),
}).partial();

export type ProjectFilterDto = z.infer<typeof projectFilterSchema>;