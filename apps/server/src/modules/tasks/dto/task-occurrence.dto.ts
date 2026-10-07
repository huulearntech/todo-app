import { createZodDto } from 'nestjs-zod';
import {
  completeTaskOccurrenceInputSchema,
  postponeTaskInputSchema,
  type CompleteTaskOccurrenceInput as CompleteTaskOccurrencePayload,
  type PostponeTaskInput as PostponeTaskPayload,
} from '@todo/shared';

export class CompleteTaskOccurrenceDto extends createZodDto(
  completeTaskOccurrenceInputSchema,
) {}
export type CompleteTaskOccurrenceInput = CompleteTaskOccurrencePayload;

// Backward-compatible aliases
export class CompleteTaskDto extends CompleteTaskOccurrenceDto {}
export type CompleteTaskInput = CompleteTaskOccurrencePayload;

export class PostponeTaskDto extends createZodDto(postponeTaskInputSchema) {}
export type PostponeTaskInput = PostponeTaskPayload;
