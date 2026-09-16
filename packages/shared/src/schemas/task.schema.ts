import { z } from "zod";

export const createTaskSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  dueDate: z.date().optional(),
  priority: z.enum(["low", "medium", "high"]).optional(),
  completed: z.boolean().optional(), // NOTE: of course this should be false.
  projectId: z.string().optional(), // NOTE: this is the id of the project that the task belongs to. If not provided, the task will be added to the default project (Inbox).
});

export type CreateTaskDto = z.infer<typeof createTaskSchema>;


export const taskFilterSchema = z.object({
  title: z.string(),
  status: z.string(),
  projectId: z.string(),
}).partial();

export type TaskFilterDto = z.infer<typeof taskFilterSchema>;