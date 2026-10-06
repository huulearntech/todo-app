import { createZodDto } from 'nestjs-zod';
import { createColorSchema } from '@todo/shared';

export class CreateColorDto extends createZodDto(createColorSchema) {}
