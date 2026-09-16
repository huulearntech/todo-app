// import { IsString, IsOptional } from 'class-validator';

// export class CreateProjectDto {
//   @IsString()
//   name!: string;

//   @IsOptional()
//   @IsString()
//   description?: string;
// }

import { createZodDto } from "nestjs-zod";
import { createProjectSchema, type CreateProjectDto as CreateProjectPayload } from "@todo/shared";

export class CreateProjectDto extends createZodDto(createProjectSchema) { }
export interface CreateProjectDto extends CreateProjectPayload { }