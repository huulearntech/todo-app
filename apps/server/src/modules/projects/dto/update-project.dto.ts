import { createZodDto } from 'nestjs-zod';
import { updateProjectSchema } from '@todo/shared';

export class UpdateProjectDto extends createZodDto(updateProjectSchema) {}
