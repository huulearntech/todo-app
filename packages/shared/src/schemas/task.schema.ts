import { z } from "zod";
import { TaskPriority } from "../enums/task-priority.enum.js";

// TODO: Fix the sectionId (required) and projectId (delete it)
export const createTaskSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  startedAt: z.coerce.date().optional(),
  dueAt: z.coerce.date().optional(),
  priority: z.enum(TaskPriority).optional(),
  sectionId: z.string().optional(), // NOTE: this is the id of the section that the task belongs to. If not provided, the task will be added directly to the project
}).refine((data) => {
  if (data.startedAt && data.dueAt) {
    return data.startedAt <= data.dueAt;
  }
  return true;
}, {
  message: "Start date must be before due date",
  path: ["dueAt"],
});

export type CreateTaskDto = z.infer<typeof createTaskSchema>;
export type CreateTaskInput = z.input<typeof createTaskSchema>;

export const createTaskSchemaDefaultValues: CreateTaskDto = {
  title: "",
  description: "",
  startedAt: undefined,
  dueAt: undefined,
  priority: TaskPriority.HIGH,
  sectionId: undefined,
};

// TODO: fix
export const updateTaskSchema = z.object({
  title: z.string().min(1, "Title is required").optional(),
  description: z.string().optional(),
  startedAt: z.coerce.date(),
  dueAt: z.coerce.date().nullable(),
  priority: z.enum(TaskPriority).optional(),
  sectionId: z.string().optional(), // NOTE: this is the id of the section that the task belongs to. If not provided, the task will be added directly to the project
  labels: z.array(z.object({ id: z.string()})),
}).refine((data) => {
  return !data.dueAt || data.startedAt <= data.dueAt;
}, {
  message: "Start date must be before due date",
  path: ["dueAt"],
});

export type UpdateTaskDto = z.infer<typeof updateTaskSchema>; // This has the same shape as z.output. // TODO: @Robustness
export type UpdateTaskInput = z.input<typeof updateTaskSchema>;


export const taskFilterSchema = z.object({
  title: z.string(),
  projectId: z.string(),
  startedAt: z.coerce.date(),
  dueAt: z.coerce.date(),
}).partial();

export type TaskFilterDto = z.infer<typeof taskFilterSchema>;