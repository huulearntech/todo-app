import { createZodDto } from 'nestjs-zod';
import {
  createTaskLabelSchema,
  updateTaskLabelSchema,
  taskLabelResponseSchema,
} from '@todo/shared';

export class CreateTaskLabelDto extends createZodDto(createTaskLabelSchema) {}
export class UpdateTaskLabelDto extends createZodDto(updateTaskLabelSchema) {}
export class TaskLabelResponseDto extends createZodDto(
  taskLabelResponseSchema,
) {}
export class TaskLabelDto extends CreateTaskLabelDto {}
