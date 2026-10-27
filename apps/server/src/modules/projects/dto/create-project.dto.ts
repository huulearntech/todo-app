import { createZodDto } from 'nestjs-zod';
import { createProjectSchema } from '@todo/shared';

export class CreateProjectDto extends createZodDto(createProjectSchema) {}
