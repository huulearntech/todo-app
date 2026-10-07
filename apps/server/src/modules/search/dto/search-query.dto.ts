import { createZodDto } from 'nestjs-zod';
import { searchQuerySchema } from '@todo/shared';

export class SearchQueryDto extends createZodDto(searchQuerySchema) {}
