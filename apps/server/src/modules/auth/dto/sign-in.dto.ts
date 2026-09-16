import { createZodDto } from 'nestjs-zod';
import { signInSchema, type SignInDto as SignInPayload } from "@todo/shared";

export class SignInDto extends createZodDto(signInSchema) {}
export interface SignInDto extends SignInPayload {}