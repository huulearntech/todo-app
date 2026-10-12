import { z } from "zod";

export const updateUserSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Name is required")
    .max(100, "Name must be at most 100 characters long"),
  avatarUrl: z.url("Invalid URL"),
}).partial();

export type UpdateUserDto = z.infer<typeof updateUserSchema>;

export const userResponseSchema = z.object({
  id: z.uuid(), // ??
  email: z.email(),
  name: z.string(),
  avatarUrl: z.url().nullish(), // NOTE: is this a good idea? should null be a state at all?
  defaultProjectId: z.uuid(),
  isEmailVerified: z.boolean().optional(),
});

export type UserResponseDto = z.infer<typeof userResponseSchema>;