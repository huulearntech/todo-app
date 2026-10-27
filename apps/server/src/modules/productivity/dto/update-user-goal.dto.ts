import { createZodDto } from 'nestjs-zod';
import { updateUserGoalSchema } from '@todo/shared';

export class UpdateUserGoalDto extends createZodDto(updateUserGoalSchema) {}
