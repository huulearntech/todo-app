import { createZodDto } from 'nestjs-zod';
import { forgotPasswordRequestSchema } from '@todo/shared';

export class ForgotPasswordRequestDto extends createZodDto(
  forgotPasswordRequestSchema,
) {}
