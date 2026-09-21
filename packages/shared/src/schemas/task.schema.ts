import { z } from "zod";
import { TaskPriority } from "../enums/task-priority.enum.js";

// TODO: Fix the sectionId (required) and projectId (delete it)
export const createTaskSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  dueDate: z.date().optional(),
  priority: z.enum(TaskPriority).optional(),
  sectionId: z.string().optional(), // NOTE: this is the id of the section that the task belongs to. If not provided, the task will be added directly to the project
});

export type CreateTaskDto = z.infer<typeof createTaskSchema>;

export const createTaskSchemaDefaultValues: CreateTaskDto = {
  title: "",
  description: "",
  dueDate: undefined,
  priority: TaskPriority.HIGH,
  sectionId: undefined,
};

// TODO: fix
export const updateTaskSchema = z.object({
  title: z.string().min(1, "Title is required").optional(),
  description: z.string().optional(),
  dueDate: z.date().optional(),
  priority: z.enum(TaskPriority).optional(),
  sectionId: z.string().optional(), // NOTE: this is the id of the section that the task belongs to. If not provided, the task will be added directly to the project
  labels: z.array(z.object({ id: z.string()})),
});

export type UpdateTaskDto = z.infer<typeof updateTaskSchema>;


export const taskFilterSchema = z.object({
  title: z.string(),
  projectId: z.string(),
  dueDate: z.date(),
}).partial();

export type TaskFilterDto = z.infer<typeof taskFilterSchema>;