import { createZodDto } from 'nestjs-zod';
import {
  magicLinkRequestSchema,
  magicLinkCallbackQuerySchema,
  magicLinkVerifySchema,
} from '@todo/shared';

export class MagicLinkRequestDto extends createZodDto(magicLinkRequestSchema) {}

export class MagicLinkCallbackQueryDto extends createZodDto(
  magicLinkCallbackQuerySchema,
) {}

export class MagicLinkVerifyDto extends createZodDto(magicLinkVerifySchema) {}
