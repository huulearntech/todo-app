import { createZodDto } from 'nestjs-zod';
import {
  forgotPasswordRequestSchema,
  type ForgotPasswordRequestDto as ForgotPasswordRequestPayload,
} from '@todo/shared';

export class ForgotPasswordRequestDto extends createZodDto(
  forgotPasswordRequestSchema,
) {}
export interface ForgotPasswordRequestDto extends ForgotPasswordRequestPayload {}
