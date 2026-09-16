import { IsString, IsEmail, IsUrl, IsOptional } from 'class-validator'
import { signUpSchema, updateUserProfileSchema } from "@todo/shared"
import {
  type SignUpDto as SignUpPayload,
  type UpdateUserProfileDto as UpdateUserProfilePayload,
} from "@todo/shared"
import { createZodDto } from "nestjs-zod"

export class SignUpDto extends createZodDto(signUpSchema) {}
export interface SignUpDto extends SignUpPayload {}

export class UpdateUserProfileDto extends createZodDto(updateUserProfileSchema) {}
export interface UpdateUserProfileDto extends UpdateUserProfilePayload {}

// TODO: remove this.
export class UserResponse {
  @IsEmail()
  email!: string;

  @IsString()
  name!: string;

  @IsOptional()
  @IsUrl()
  avatarUrl?: string | null;
}