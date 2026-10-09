import { z } from 'zod';
import { PALETTE_COLORS } from '../../enums/color-palette.enum.js';

export const colorKeySchema = z.enum(PALETTE_COLORS);

export const createColorSchema = z.object({
  key: colorKeySchema,
  name: z.string().min(1, 'Name is required').max(100, 'Name must be at most 100 characters'),
});

export type CreateColorDto = z.infer<typeof createColorSchema>;

export const updateColorSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be at most 100 characters'),
});

export type UpdateColorDto = z.infer<typeof updateColorSchema>;

export const colorResponseSchema = z.object({
  ownerId: z.string().uuid(),
  key: colorKeySchema,
  name: z.string(),
});

export type ColorResponseDto = z.infer<typeof colorResponseSchema>;
