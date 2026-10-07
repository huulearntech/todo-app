import { createZodDto } from 'nestjs-zod';
import {
  magicLinkRequestSchema,
  type MagicLinkRequestDto as MagicLinkRequestPayload,
  magicLinkCallbackQuerySchema,
  type MagicLinkCallbackQueryDto as MagicLinkCallbackQueryPayload,
} from '@todo/shared';

export class MagicLinkRequestDto extends createZodDto(magicLinkRequestSchema) {}
export interface MagicLinkRequestDto extends MagicLinkRequestPayload {}

export class MagicLinkCallbackQueryDto extends createZodDto(
  magicLinkCallbackQuerySchema,
) {}
export interface MagicLinkCallbackQueryDto extends MagicLinkCallbackQueryPayload {}
