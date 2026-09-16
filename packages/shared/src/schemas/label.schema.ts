import { z } from "zod";

export const createLabelSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
});

export type CreateLabelDto = z.infer<typeof createLabelSchema>;