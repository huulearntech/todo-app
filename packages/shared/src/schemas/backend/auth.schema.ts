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

export const verificationStatusSchema = z.object({
  isEmailVerified: z.boolean(),
});

export type VerificationStatusResponseDto = z.infer<
  typeof verificationStatusSchema
>;

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z
    .string()
    .min(8, "New password must be at least 8 characters long")
    .max(100, "New password must be at most 100 characters long"),
});

export type ChangePasswordDto = z.infer<typeof changePasswordSchema>;

export const forgotPasswordRequestSchema = z.object({
  email: z.email("Invalid email address").trim().toLowerCase(),
});

export type ForgotPasswordRequestDto = z.infer<
  typeof forgotPasswordRequestSchema
>;

export const resetPasswordSchema = z.object({
  token: z.string().min(1, "Token is required"),
  newPassword: z
    .string()
    .min(8, "Password must be at least 8 characters long")
    .max(100, "Password must be at most 100 characters long"),
});

export type ResetPasswordDto = z.infer<typeof resetPasswordSchema>;

export const AUTH_ERROR_CODES = {
  EMAIL_ALREADY_EXISTS: 'EMAIL_ALREADY_EXISTS',
  EMAIL_NOT_VERIFIED: 'EMAIL_NOT_VERIFIED',
  INVALID_CURRENT_PASSWORD: 'INVALID_CURRENT_PASSWORD',
  SAME_PASSWORD: 'SAME_PASSWORD',
} as const;

export type AuthErrorCode =
  (typeof AUTH_ERROR_CODES)[keyof typeof AUTH_ERROR_CODES];
