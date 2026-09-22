import { createZodDto } from "nestjs-zod";
import { createTaskSchema, type CreateTaskDto as CreateTaskPayload } from "@todo/shared";
import { updateTaskSchema, type UpdateTaskDto as UpdateTaskPayload } from "@todo/shared";

export class AddTaskDto extends createZodDto(createTaskSchema) {}
export interface CreateTaskDto extends CreateTaskPayload {}

export class UpdateTaskDto extends createZodDto(updateTaskSchema) {}
export interface UpdateTaskDto extends UpdateTaskPayload {}