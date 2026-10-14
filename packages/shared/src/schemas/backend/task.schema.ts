import { z } from "zod";
import { TaskPriority } from "../../enums/task-priority.enum.js";
import { cursorPaginationSchema } from "./cursor-pagination.schema.js";
import { rruleSchema } from "./rrule.schema.js";

const baseRelativeReminderSchema = z.object({
  id: z.uuid().optional(),
  type: z.literal("relative"),
  minuteOffset: z.number().int().min(0).max(43200),
  remindAt: z.null().optional(),
  channel: z.literal("email"),
});

const baseAbsoluteReminderSchema = z.object({
  id: z.uuid().optional(),
  type: z.literal("absolute"),
  remindAt: z.iso.datetime(),
  minuteOffset: z.null().optional(),
  channel: z.literal("email"),
});

export const reminderSchema = z.discriminatedUnion("type", [
  baseRelativeReminderSchema,
  baseAbsoluteReminderSchema,
]);

export const reminderResponseSchema = z.discriminatedUnion("type", [
  baseRelativeReminderSchema.extend({ id: z.uuid() }),
  baseAbsoluteReminderSchema.extend({ id: z.uuid() }),
]);

export type ReminderDto = z.infer<typeof reminderSchema>;
export type ReminderResponseDto = z.infer<typeof reminderResponseSchema>;

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
  title: z
    .string()
    .trim()
    .min(1, "Title is required")
    .max(500, "Title must be at most 500 characters"),
  description: z
    .string()
    .max(10_000, "Description must be at most 10000 characters"),

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

export const reorderTaskSchema = z.object({
  sectionId: z.uuid("Section ID must be a valid UUID"),
  prevId: z.uuid("Previous task ID must be a valid UUID").nullable(),
});

export type ReorderTaskDto = z.infer<typeof reorderTaskSchema>;


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
  priorities: z.preprocess((value) => {
    if (value === undefined || value === null) return undefined;
    if (typeof value === 'string') return [value];
    return value;
  }, z.enum(TaskPriority).array()),
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
  reminders: reminderResponseSchema.array().default([]),
});

export type TaskResponseDto = z.infer<typeof taskResponseSchema>;

export const completedOccurrenceResponseSchema = taskResponseSchema.extend({
  occurrenceId: z.uuid(),
  scheduledDate: z.iso.datetime().nullable(),
  completedAt: z.iso.datetime().nullable(),
  isLatestOccurrence: z.boolean().default(true),
});

export type CompletedOccurrenceResponseDto = z.infer<typeof completedOccurrenceResponseSchema>;