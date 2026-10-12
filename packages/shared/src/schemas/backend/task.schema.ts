import { z } from "zod";
import { TaskPriority } from "../../enums/task-priority.enum.js";
import { cursorPaginationSchema } from "./cursor-pagination.schema.js";
import { rruleSchema } from "./rrule.schema.js";

export const reminderSchema = z.object({
  id: z.uuid().optional(),
  type: z.enum(["relative", "absolute"]),
  minuteOffset: z.number().int().min(0).max(43200).nullable(),
  remindAt: z.iso.datetime().nullable().optional(),
  channel: z.enum(["email"]),
});

export type ReminderDto = z.infer<typeof reminderSchema>;

export const REMINDER_PRESETS = [
  { label: "At time of task", minutes: 0 },
  { label: "10 minutes before", minutes: 10 },
  { label: "15 minutes before", minutes: 15 },
  { label: "30 minutes before", minutes: 30 },
  { label: "1 hour before", minutes: 60 },
  { label: "2 hours before", minutes: 120 },
  { label: "1 day before", minutes: 1440 },
] as const;

export const createTaskSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string(),

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
  reminders: reminderSchema.array(),
});

export type CreateTaskDto = z.infer<typeof createTaskSchema>;


// =====================================
export const updateTaskSchema = createTaskSchema.partial();
export type UpdateTaskDto = z.infer<typeof updateTaskSchema>;
// =====================================


export const taskFilterSchema = z.object({
  title: z.string(),
  projectId: z.string(),
  status: z.enum(["pending", "completed"]),
  taskLabelIds: z.preprocess((value) => {
    // If empty/null, return undefined
    if (value === undefined || value === null) return undefined;
    // When client sends only 1 element, query parsers may produce a string rather than an array
    if (typeof value === 'string') return [value];
    return value;
  }, z.uuid().array()),
})
  .extend({
    pagination: cursorPaginationSchema
  })
  .partial();

export type TaskFilterDto = z.infer<typeof taskFilterSchema>;

export const taskResponseSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().default(""),
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
  recurrence: rruleSchema.nullable(),
  reminders: reminderSchema.extend({
    id: z.uuid(),
  }).array().default([]),
});

export type TaskResponseDto = z.infer<typeof taskResponseSchema>;

export const completedOccurrenceResponseSchema = taskResponseSchema.extend({
  occurrenceId: z.uuid(),
  scheduledDate: z.iso.datetime().nullable(),
  completedAt: z.iso.datetime(),
  isLatestOccurrence: z.boolean().default(true),
});

export type CompletedOccurrenceResponseDto = z.infer<typeof completedOccurrenceResponseSchema>;