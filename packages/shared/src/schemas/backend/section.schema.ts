import { z } from "zod";

const createSectionSchema = z.object({
  projectId: z.uuid("Project ID must be a valid UUID"),
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
});


const updateSectionSchema = createSectionSchema.omit({ projectId: true }).partial();

const sectionResponseSchema = z.object({
  id: z.uuid("Section ID must be a valid UUID"),
  projectId: z.uuid("Project ID must be a valid UUID"),
  name: z.string(),
  description: z.string().optional(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

const sectionFilterSchema = z.object({
  projectId: z.string().optional(),
  name: z.string().optional(),
});


// TODO: differentiate dto from server to client and vice versa
type CreateSectionDto   = z.infer<typeof createSectionSchema>;
type UpdateSectionDto   = z.infer<typeof updateSectionSchema>;
type SectionResponseDto = z.infer<typeof sectionResponseSchema>;
type SectionFilterDto   = z.infer<typeof sectionFilterSchema>;

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