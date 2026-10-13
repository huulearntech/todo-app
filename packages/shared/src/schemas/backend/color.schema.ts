import { z } from 'zod';
import { PALETTE_COLORS } from '../../enums/color-palette.enum.js';

export const colorKeySchema = z.enum(PALETTE_COLORS);


export const colorResponseSchema = z.object({
  key: colorKeySchema,
  name: z.string(),
});

export type ColorResponseDto = z.infer<typeof colorResponseSchema>;
