import { z } from "zod";

export const createProjectSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
});

export type CreateProjectDto = z.infer<typeof createProjectSchema>;

export const updateProjectSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string(),
}).partial();

export type UpdateProjectDto = z.infer<typeof updateProjectSchema>;


export const projectResponseSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  description: z.string().optional(),
});

export type ProjectResponseDto = z.infer<typeof projectResponseSchema>;


export const projectFilterSchema = z.object({
  name: z.string(),
  isDefault: z.stringbool(),
}).partial();

export type ProjectFilterDto = z.infer<typeof projectFilterSchema>;