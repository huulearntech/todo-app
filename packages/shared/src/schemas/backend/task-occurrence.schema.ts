import { z } from "zod";
import { TaskOccurrenceStatus } from "../../enums/task-occurrence-status.enum.js";

export const taskOccurrenceSchema = z.object({
  id: z.uuid(),
  taskId: z.uuid(),
  userId: z.uuid(),
  scheduledDate: z.iso.datetime({ precision: 3 }).nullable(),
  status: z.enum(TaskOccurrenceStatus),
  completedAt: z.iso.datetime({ precision: 3 }).nullable(),
  createdAt: z.iso.datetime({ precision: 3 }),
  updatedAt: z.iso.datetime({ precision: 3 }),
});

export type TaskOccurrenceDto = z.infer<typeof taskOccurrenceSchema>;

export const completeTaskOccurrenceInputSchema = z.object({
  scheduledDate: z.iso.datetime({ precision: 3 }).optional(),
  completedAt: z.iso.datetime({ precision: 3 }).optional(),
});
export type CompleteTaskOccurrenceInput = z.infer<typeof completeTaskOccurrenceInputSchema>;

export const completeTaskOccurrenceResponseSchema = z.object({
  occurrenceId: z.uuid(),
  taskId: z.uuid(),
  isRecurringAdvanced: z.boolean(),
  status: z.enum(TaskOccurrenceStatus),
  completedAt: z.iso.datetime({ precision: 3 }),
  nextDueTime: z.iso.datetime({ precision: 3 }).nullable().optional(),
});
export type CompleteTaskOccurrenceResponseDto = z.infer<typeof completeTaskOccurrenceResponseSchema>;

// Backward compatibility aliases
export const completeTaskInputSchema = completeTaskOccurrenceInputSchema;
export type CompleteTaskInput = CompleteTaskOccurrenceInput;
export const completeTaskResponseSchema = completeTaskOccurrenceResponseSchema;
export type CompleteTaskResponseDto = CompleteTaskOccurrenceResponseDto;

export const postponeTaskInputSchema = z.object({
  postponeTo: z.iso.datetime({ precision: 3 }),
});
export type PostponeTaskInput = z.infer<typeof postponeTaskInputSchema>;
