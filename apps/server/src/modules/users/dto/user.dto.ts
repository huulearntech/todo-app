import { createZodDto } from 'nestjs-zod';
import { updateUserSchema, userResponseSchema } from '@todo/shared';

export class UpdateUserDto extends createZodDto(updateUserSchema) {}

export class UserResponseDto extends createZodDto(userResponseSchema) {}
