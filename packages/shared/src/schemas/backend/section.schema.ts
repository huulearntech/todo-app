import { z } from "zod";

export const createSectionSchema = z.object({
  projectId: z.uuid("Project ID must be a valid UUID"),
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
});

export type CreateSectionDto = z.infer<typeof createSectionSchema>;