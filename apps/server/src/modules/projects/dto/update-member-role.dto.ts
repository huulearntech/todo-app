import { createZodDto } from 'nestjs-zod';
import {
  updateMemberRoleSchema,
  type UpdateMemberRoleDto as UpdateMemberRolePayload,
} from '@todo/shared';

export class UpdateMemberRoleDto extends createZodDto(updateMemberRoleSchema) {}
export interface UpdateMemberRoleDto extends UpdateMemberRolePayload {}
