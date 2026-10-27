import { createZodDto } from 'nestjs-zod';
import { projectFilterSchema } from '@todo/shared';

export class ProjectFilterDto extends createZodDto(projectFilterSchema) {}
