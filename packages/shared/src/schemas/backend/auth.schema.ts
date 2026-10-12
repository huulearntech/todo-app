import { z } from "zod";

export const signInSchema = z.object({
  email: z.email("Invalid email address").trim().toLowerCase(),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters long")
    .max(100, "Password must be at most 100 characters long"),
});

export type SignInDto = z.infer<typeof signInSchema>;


export const signUpSchema = z.object({
  email: z.email("Invalid email address").trim().toLowerCase(),
  name: z
    .string()
    .trim()
    .min(1, "Name is required")
    .max(100, "Name must be at most 100 characters long"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters long")
    .max(100, "Password must be at most 100 characters long"),
});

export type SignUpDto = z.infer<typeof signUpSchema>;

export const magicLinkRequestSchema = z.object({
  email: z.email("Invalid email address").trim().toLowerCase(),
});

export type MagicLinkRequestDto = z.infer<typeof magicLinkRequestSchema>;

export const magicLinkCallbackQuerySchema = z.object({
  token: z.string().min(1, "Token is required"),
});

export type MagicLinkCallbackQueryDto = z.infer<
  typeof magicLinkCallbackQuerySchema
>;

export const magicLinkVerifySchema = z.object({
  token: z.string().min(1, "Token is required"),
});

export type MagicLinkVerifyDto = z.infer<typeof magicLinkVerifySchema>;

