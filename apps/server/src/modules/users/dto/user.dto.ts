import { IsString, IsEmail, IsUrl, IsOptional } from 'class-validator'
import { PartialType, PickType } from '@nestjs/mapped-types'

export class CreateUserDto {
  @IsEmail()
  email!: string;

  @IsString()
  name!: string;

  @IsString()
  password!: string;

  @IsOptional()
  @IsUrl()
  avatarUrl?: string;
}

export class UpdateUserDto extends PartialType(CreateUserDto) {}

export class UserResponseDto extends PickType(CreateUserDto, ['email', 'name', 'avatarUrl'] as const) {}