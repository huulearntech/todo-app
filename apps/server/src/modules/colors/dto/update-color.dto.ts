import { createZodDto } from 'nestjs-zod';
import { updateColorSchema } from '@todo/shared';

export class UpdateColorDto extends createZodDto(updateColorSchema) {}
