import { z } from "zod";
import { TaskPriority } from "../../enums/task-priority.enum.js";

export const createTaskSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),

  timeRange: z
    .object({
      start: z.iso.datetime({ precision: 3 }),
      end: z.iso.datetime({ precision: 3 }),
    })
    .nullable()
    .refine((data) => {
      if (data) {
        return data.start <= data.end;
      }
      return true;
    }, {
      message: "Start date must be before end date",
    }),

  priority: z.enum(TaskPriority),
  sectionId: z.uuid(),
});

export type CreateTaskDto = z.infer<typeof createTaskSchema>;


// =====================================
export const updateTaskSchema = createTaskSchema.partial();
export type UpdateTaskDto = z.infer<typeof updateTaskSchema>;
// =====================================


export const taskFilterSchema = z.object({
  title: z.string(),
  projectId: z.string(),
  // startedAt: z.coerce.date(),
  // dueAt: z.coerce.date(),
}).partial();

export type TaskFilterDto = z.infer<typeof taskFilterSchema>;