import { IsString, IsOptional } from 'class-validator';

export class TaskLabelDto {
  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;
}