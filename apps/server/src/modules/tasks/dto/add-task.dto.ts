import { createZodDto } from 'nestjs-zod';
import {
  createTaskSchema,
  updateTaskSchema,
  reorderTaskSchema,
} from '@todo/shared';

export class CreateTaskDto extends createZodDto(createTaskSchema) {}
export { CreateTaskDto as AddTaskDto };

export class UpdateTaskDto extends createZodDto(updateTaskSchema) {}

export class ReorderTaskDto extends createZodDto(reorderTaskSchema) {}
