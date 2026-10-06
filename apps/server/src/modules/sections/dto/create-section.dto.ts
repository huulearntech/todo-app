import { createZodDto } from 'nestjs-zod';
import {
  createSectionSchema,
  type CreateSectionDto as CreateSectionPayload,
} from '@todo/shared';
import {
  updateSectionSchema,
  type UpdateSectionDto as UpdateSectionPayload,
} from '@todo/shared';
import {
  sectionResponseSchema,
  type SectionResponseDto as SectionResponsePayload,
} from '@todo/shared';
import {
  sectionFilterSchema,
  type SectionFilterDto as SectionFilterPayload,
} from '@todo/shared';

export class CreateSectionDto extends createZodDto(createSectionSchema) {}
export interface CreateSectionDto extends CreateSectionPayload {}

export class UpdateSectionDto extends createZodDto(updateSectionSchema) {}
export interface UpdateSectionDto extends UpdateSectionPayload {}

export class SectionResponseDto extends createZodDto(sectionResponseSchema) {}
export interface SectionResponseDto extends SectionResponsePayload {}

export class SectionFilterDto extends createZodDto(sectionFilterSchema) {}
export interface SectionFilterDto extends SectionFilterPayload {}
