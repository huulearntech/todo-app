import { z } from "zod";

export const userProfileSchema = z.object({
  name: z.string().min(1, "Name is required"),
  avatarUrl: z.url("Invalid URL"),
}).partial();

export type UserProfileDto = z.infer<typeof userProfileSchema>;