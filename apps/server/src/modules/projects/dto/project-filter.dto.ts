import { createZodDto } from "nestjs-zod";
import { projectFilterSchema, type ProjectFilterDto as ProjectFilterPayload } from "@todo/shared";

export class ProjectFilterDto extends createZodDto(projectFilterSchema) {}
export interface ProjectFilterDto extends ProjectFilterPayload {}