import { z } from "zod";
import { colorKeySchema } from "./color.schema.js";

const createSectionSchema = z.object({
  projectId: z.uuid("Project ID must be a valid UUID"),
  name: z.string().trim().min(1, "Name is required").max(100, "Name must be at most 100 characters"),
  description: z.string().max(10_000, "Description must be at most 10000 characters").optional(),
  colorKey: colorKeySchema.nullable().optional(),
});


const updateSectionSchema = createSectionSchema.omit({ projectId: true }).partial();

const reorderSectionSchema = z.object({
  prevId: z.uuid("Previous section ID must be a valid UUID").nullable(),
});

const sectionResponseSchema = z.object({
  id: z.uuid("Section ID must be a valid UUID"),
  projectId: z.uuid("Project ID must be a valid UUID"),
  name: z.string(),
  description: z.string().nullable().optional(),
  colorKey: colorKeySchema.nullable().optional(),
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
type ReorderSectionDto  = z.infer<typeof reorderSectionSchema>;
type SectionResponseDto = z.infer<typeof sectionResponseSchema>;
type SectionFilterDto   = z.infer<typeof sectionFilterSchema>;

export {
  createSectionSchema,
  updateSectionSchema,
  reorderSectionSchema,
  sectionResponseSchema,
  sectionFilterSchema,
}

export type {
  CreateSectionDto,
  UpdateSectionDto,
  ReorderSectionDto,
  SectionResponseDto,
  SectionFilterDto,
}