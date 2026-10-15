import { createZodDto } from 'nestjs-zod';
import {
  resetPasswordSchema,
  type ResetPasswordDto as ResetPasswordPayload,
} from '@todo/shared';

export class ResetPasswordDto extends createZodDto(resetPasswordSchema) {}
export interface ResetPasswordDto extends ResetPasswordPayload {}
