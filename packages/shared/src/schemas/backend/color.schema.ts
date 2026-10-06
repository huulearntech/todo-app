import { z } from "zod";

export const hexCodeSchema = z
  .string()
  .regex(/^#[0-9A-Fa-f]{6}$/, "Must be a 7-character hex color (e.g. #3B82F6)");

export const createColorSchema = z.object({
  hexCode: hexCodeSchema,
  name: z.string().min(1, "Name is required").max(100, "Name must be at most 100 characters"),
});

export type CreateColorDto = z.infer<typeof createColorSchema>;

export const updateColorSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name must be at most 100 characters"),
});

export type UpdateColorDto = z.infer<typeof updateColorSchema>;

export const colorResponseSchema = z.object({
  ownerId: z.string().uuid(),
  hexCode: z.string(),
  name: z.string(),
});

export type ColorResponseDto = z.infer<typeof colorResponseSchema>;
