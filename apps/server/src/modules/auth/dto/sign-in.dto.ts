import { createZodDto } from 'nestjs-zod';
import { signInSchema } from '@todo/shared';

export class SignInDto extends createZodDto(signInSchema) {}
