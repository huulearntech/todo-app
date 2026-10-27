import { createZodDto } from 'nestjs-zod';
import { updateMemberRoleSchema } from '@todo/shared';

export class UpdateMemberRoleDto extends createZodDto(updateMemberRoleSchema) {}
