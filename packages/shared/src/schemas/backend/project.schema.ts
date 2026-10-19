import { z } from "zod";
import { colorKeySchema, colorResponseSchema } from "./color.schema.js";
import { ProjectRole } from "../../enums/project-role.enum.js";
import { ProjectInvitationStatus } from "../../enums/project-invitation-status.enum.js";

export const createProjectSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Name is required")
    .max(100, "Name must be at most 100 characters long"),
  description: z
    .string()
    .max(10_000, "Description must be at most 10000 characters")
    .optional(),
  colorKey: colorKeySchema.optional(),
});

export type CreateProjectDto = z.infer<typeof createProjectSchema>;

export const updateProjectSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Name is required")
    .max(100, "Name must be at most 100 characters long"),
  description: z
    .string()
    .max(10_000, "Description must be at most 10000 characters"),
  colorKey: colorKeySchema,
}).partial();

export type UpdateProjectDto = z.infer<typeof updateProjectSchema>;


export const projectResponseSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  description: z.string().optional(),
  colorKey: colorKeySchema.optional(),
  color: colorResponseSchema.optional(),
  role: z.enum(ProjectRole).optional(),
});

export type ProjectResponseDto = z.infer<typeof projectResponseSchema>;


export const projectFilterSchema = z.object({
  name: z.string(),
  isDefault: z.stringbool(),
}).partial();

export type ProjectFilterDto = z.infer<typeof projectFilterSchema>;

export const createInvitationSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("A valid email address is required"),
  role: z.enum([ProjectRole.ADMIN, ProjectRole.EDITOR, ProjectRole.VIEWER]),
});

export type CreateInvitationDto = z.infer<typeof createInvitationSchema>;

export const updateMemberRoleSchema = z.object({
  role: z.enum([ProjectRole.ADMIN, ProjectRole.EDITOR, ProjectRole.VIEWER]),
});

export type UpdateMemberRoleDto = z.infer<typeof updateMemberRoleSchema>;

export const acceptInvitationSchema = z.object({
  token: z.string().min(1, "Token is required"),
});

export type AcceptInvitationDto = z.infer<typeof acceptInvitationSchema>;

export const projectMemberResponseSchema = z.object({
  id: z.uuid(),
  projectId: z.uuid(),
  userId: z.uuid(),
  role: z.enum(ProjectRole),
  user: z
    .object({
      id: z.uuid(),
      name: z.string(),
      email: z.string(),
      avatarUrl: z.string().nullable().optional(),
    })
    .optional(),
  createdAt: z.string().datetime().optional(),
});

export type ProjectMemberResponseDto = z.infer<typeof projectMemberResponseSchema>;

export const projectInvitationResponseSchema = z.object({
  id: z.uuid(),
  projectId: z.uuid(),
  invitedEmail: z.string(),
  role: z.enum(ProjectRole),
  status: z.enum(ProjectInvitationStatus),
  expiresAt: z.string().datetime().optional(),
  createdAt: z.string().datetime().optional(),
  invitedBy: z
    .object({
      id: z.uuid(),
      name: z.string(),
      email: z.string(),
    })
    .optional(),
});

export type ProjectInvitationResponseDto = z.infer<
  typeof projectInvitationResponseSchema
>;