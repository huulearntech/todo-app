import { updateUserGoalSchema } from '@todo/shared';
import type { UpdateUserGoalDto as UpdateUserGoalPayload } from '@todo/shared';
import { createZodDto } from 'nestjs-zod';

export class UpdateUserGoalDto extends createZodDto(updateUserGoalSchema) {}
export interface UpdateUserGoalDto extends UpdateUserGoalPayload {}
