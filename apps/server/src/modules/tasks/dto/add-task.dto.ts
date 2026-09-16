// import { IsString, IsOptional, IsEnum, IsDate, IsUUID } from "class-validator";
// import { TaskPriority } from "../enums/task-priority.enum";

// export class AddTaskDto {
//   @IsString()
//   title!: string;

//   @IsOptional()
//   @IsString()
//   description?: string;

//   @IsOptional()
//   @IsDate()
//   dueDate?: Date;

//   @IsOptional()
//   @IsEnum(TaskPriority)
//   priority?: TaskPriority;

//   @IsOptional()
//   @IsString()
//   category?: string; // NOTE: this should be the sectionId? and should add projectId?
// }


import { createZodDto } from "nestjs-zod";
import { createTaskSchema, type CreateTaskDto as CreateTaskPayload } from "@todo/shared";

export class AddTaskDto extends createZodDto(createTaskSchema) {}
export interface CreateTaskDto extends CreateTaskPayload {}