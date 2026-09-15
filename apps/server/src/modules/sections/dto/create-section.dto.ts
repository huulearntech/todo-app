import { IsString, IsOptional, IsUUID } from 'class-validator';

export class CreateSectionDto {
  @IsUUID()
  projectId!: string;

  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;
}