import { createZodDto } from 'nestjs-zod';
import { signUpSchema } from '@todo/shared';

export class SignUpDto extends createZodDto(signUpSchema) {}
