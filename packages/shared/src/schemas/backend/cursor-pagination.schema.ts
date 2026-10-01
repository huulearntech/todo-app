import { z } from 'zod';

export const cursorPaginationSchema = z.object({
  limit: z.int().min(1).max(100),
  cursor: z.string().optional(),
  direction: z.enum(['next', 'prev']),
});