import { createZodDto } from 'nestjs-zod';
import {
  changePasswordSchema,
  type ChangePasswordDto as ChangePasswordPayload,
} from '@todo/shared';

export class ChangePasswordDto extends createZodDto(changePasswordSchema) {}
export interface ChangePasswordDto extends ChangePasswordPayload {}
