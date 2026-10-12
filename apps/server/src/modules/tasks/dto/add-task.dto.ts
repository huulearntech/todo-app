import { createZodDto } from 'nestjs-zod';
import {
  createTaskSchema,
  type CreateTaskDto as CreateTaskPayload,
  updateTaskSchema,
  type UpdateTaskDto as UpdateTaskPayload,
  reorderTaskSchema,
  type ReorderTaskDto as ReorderTaskPayload,
} from '@todo/shared';

export class AddTaskDto extends createZodDto(createTaskSchema) {}
export interface CreateTaskDto extends CreateTaskPayload {}

export class UpdateTaskDto extends createZodDto(updateTaskSchema) {}
export interface UpdateTaskDto extends UpdateTaskPayload {}

export class ReorderTaskDto extends createZodDto(reorderTaskSchema) {}
export interface ReorderTaskDto extends ReorderTaskPayload {}
