import { createZodDto } from 'nestjs-zod';
import {
  taskFilterSchema,
  type TaskFilterDto as TaskFilterPayload,
} from '@todo/shared';

export class TaskFilterDto extends createZodDto(taskFilterSchema) {}
export interface TaskFilterDto extends TaskFilterPayload {}
