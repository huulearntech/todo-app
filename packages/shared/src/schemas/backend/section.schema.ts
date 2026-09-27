import { z } from "zod";

export const createSectionSchema = z.object({
  projectId: z.uuid("Project ID must be a valid UUID"),
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
});

// TODO: may call this payload, in order to call the response data as "response"
export type CreateSectionDto = z.infer<typeof createSectionSchema>;

export const updateSectionSchema = createSectionSchema.omit({ projectId: true }).partial();
export type UpdateSectionDto = z.infer<typeof updateSectionSchema>;


export const sectionResponseSchema = z.object({
  id: z.uuid("Section ID must be a valid UUID"),
  projectId: z.uuid("Project ID must be a valid UUID"),
  name: z.string(),
  description: z.string().optional(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

export type SectionResponseDto = z.infer<typeof sectionResponseSchema>;