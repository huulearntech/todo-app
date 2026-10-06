import { createZodDto } from 'nestjs-zod';
import {
  updateProjectSchema,
  type UpdateProjectDto as UpdateProjectPayload,
} from '@todo/shared';

export class UpdateProjectDto extends createZodDto(updateProjectSchema) {}
export interface UpdateProjectDto extends UpdateProjectPayload {}
