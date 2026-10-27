import { createZodDto } from 'nestjs-zod';
import { transferProjectSchema } from '@todo/shared';

export class TransferProjectDto extends createZodDto(transferProjectSchema) {}
