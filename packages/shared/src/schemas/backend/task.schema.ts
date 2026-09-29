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
  labels: z.object({
    id: z.uuid()
  }).array(),
});

export type CreateTaskDto = z.infer<typeof createTaskSchema>;


// =====================================
export const updateTaskSchema = createTaskSchema.partial();
export type UpdateTaskDto = z.infer<typeof updateTaskSchema>;
// =====================================


export const taskFilterSchema = z.object({
  title: z.string(),
  projectId: z.string(),
  taskLabelIds: z.preprocess((value) => {
    // Nếu không truyền gì, trả về undefined
    if (value === undefined || value === null) return undefined;
    // Nếu client chỉ truyền 1 phần tử, URL query đôi khi biến nó thành string thay vì array
    if (typeof value === 'string') return [value]; 
    return value;
  }, z.uuid().array()),
}).partial();

export type TaskFilterDto = z.infer<typeof taskFilterSchema>;

export const taskResponseSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().optional(),
  timeRange: z.object({
    start: z.iso.datetime(),
    end: z.iso.datetime(),
  }).nullable(),
  priority: z.enum(TaskPriority),
  sectionId: z.uuid(),
  section: z.object({
    id: z.uuid(),
    name: z.string(),
    project: z.object({
      id: z.uuid(),
      name: z.string(),
    }),
  }),
  labels: z.object({
    id: z.uuid(),
    // name: z.string(),
  }).array(),
  completedAt: z.iso.datetime().nullable(),
});

export type TaskResponseDto = z.infer<typeof taskResponseSchema>;