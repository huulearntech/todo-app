import {
  signUpSchema,
  type SignUpDto as SignUpPayload,
} from "@todo/shared"

import { createZodDto } from "nestjs-zod"

export class SignUpDto extends createZodDto(signUpSchema) {}
export interface SignUpDto extends SignUpPayload {}