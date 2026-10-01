import { z } from "zod";

const createSectionSchema = z.object({
  projectId: z.uuid("Project ID must be a valid UUID"),
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
});

// TODO: may call this payload, in order to call the response data as "response"
type CreateSectionDto = z.infer<typeof createSectionSchema>;

const updateSectionSchema = createSectionSchema.omit({ projectId: true }).partial();
type UpdateSectionDto = z.infer<typeof updateSectionSchema>;


const sectionResponseSchema = z.object({
  id: z.uuid("Section ID must be a valid UUID"),
  projectId: z.uuid("Project ID must be a valid UUID"),
  name: z.string(),
  description: z.string().optional(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

type SectionResponseDto = z.infer<typeof sectionResponseSchema>;

const sectionFilterSchema = z.object({
  projectId: z.string().optional(),
  name: z.string().optional(),
});

type SectionFilterDto = z.infer<typeof sectionFilterSchema>;

export {
  createSectionSchema,
  updateSectionSchema,
  sectionResponseSchema,
  sectionFilterSchema,
}

export type {
  CreateSectionDto,
  UpdateSectionDto,
  SectionResponseDto,
  SectionFilterDto,
}