import { createZodDto } from 'nestjs-zod';
import { taskFilterSchema } from '@todo/shared';

export class TaskFilterDto extends createZodDto(taskFilterSchema) {}
