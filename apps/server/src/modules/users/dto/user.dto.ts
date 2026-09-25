import {
  updateUserSchema,
  userResponseSchema,
} from "@todo/shared"

import {
  type UpdateUserDto as UpdateUserPayload,
  type UserResponseDto as UserResponsePayload,
} from "@todo/shared"
import { createZodDto } from "nestjs-zod"

export class UpdateUserDto extends createZodDto(updateUserSchema) {}
export interface UpdateUserDto extends UpdateUserPayload {}

export class UserResponseDto extends createZodDto(userResponseSchema) {}
export interface UserResponseDto extends UserResponsePayload {}