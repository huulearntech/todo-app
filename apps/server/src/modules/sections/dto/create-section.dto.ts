import { createZodDto } from 'nestjs-zod';
import {
  createSectionSchema,
  updateSectionSchema,
  reorderSectionSchema,
  sectionResponseSchema,
  sectionFilterSchema,
} from '@todo/shared';

export class CreateSectionDto extends createZodDto(createSectionSchema) {}

export class UpdateSectionDto extends createZodDto(updateSectionSchema) {}

export class ReorderSectionDto extends createZodDto(reorderSectionSchema) {}

export class SectionResponseDto extends createZodDto(sectionResponseSchema) {}

export class SectionFilterDto extends createZodDto(sectionFilterSchema) {}
