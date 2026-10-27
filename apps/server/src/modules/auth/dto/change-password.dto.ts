import { createZodDto } from 'nestjs-zod';
import { changePasswordSchema } from '@todo/shared';

export class ChangePasswordDto extends createZodDto(changePasswordSchema) {}
