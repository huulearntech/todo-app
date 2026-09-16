import { z } from "zod";

export const updateUserProfileSchema = z.object({
  name: z.string().min(1, "Name is required"),
  avatarUrl: z.url("Invalid URL"),
}).partial();

export type UpdateUserProfileDto = z.infer<typeof updateUserProfileSchema>;