import { z } from "zod";

export const updateUserSchema = z.object({
  name: z.string().min(1, "Name is required"),
  avatarUrl: z.url("Invalid URL"),
}).partial();

export type UpdateUserDto = z.infer<typeof updateUserSchema>;

export const userResponseSchema = z.object({
  email: z.email(),
  name: z.string(),
  avatarUrl: z.url().nullish(), // NOTE: is this a good idea? should null be a state at all?
  defaultProjectId: z.uuid(),
});

export type UserResponseDto = z.infer<typeof userResponseSchema>;