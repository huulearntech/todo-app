// import { IsString, IsOptional, IsUUID } from 'class-validator';

// export class CreateSectionDto {
//   @IsUUID()
//   ownerId!: string;

//   @IsUUID()
//   projectId!: string;

//   @IsString()
//   name!: string;

//   @IsOptional()
//   @IsString()
//   description?: string;
// }

import { createZodDto } from "nestjs-zod";
import { createSectionSchema, type CreateSectionDto as CreateSectionPayload } from "@todo/shared";

export class CreateSectionDto extends createZodDto(createSectionSchema) {}
export interface CreateSectionDto extends CreateSectionPayload {}