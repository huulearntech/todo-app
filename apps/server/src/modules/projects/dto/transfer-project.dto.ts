import { createZodDto } from 'nestjs-zod';
import {
  transferProjectSchema,
  type TransferProjectDto as TransferProjectPayload,
} from '@todo/shared';

export class TransferProjectDto extends createZodDto(transferProjectSchema) {}
export interface TransferProjectDto extends TransferProjectPayload {}
