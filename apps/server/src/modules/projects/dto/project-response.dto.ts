import { createZodDto } from 'nestjs-zod';
import {
  projectResponseSchema,
  type ProjectResponseDto as ProjectResponsePayload,
} from '@todo/shared';

export class ProjectResponseDto extends createZodDto(projectResponseSchema) {}
export interface ProjectResponseDto extends ProjectResponsePayload {}
