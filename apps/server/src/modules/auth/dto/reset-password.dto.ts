import { createZodDto } from 'nestjs-zod';
import { resetPasswordSchema } from '@todo/shared';

export class ResetPasswordDto extends createZodDto(resetPasswordSchema) {}
