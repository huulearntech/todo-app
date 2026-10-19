import { createZodDto } from 'nestjs-zod';
import {
  createInvitationSchema,
  type CreateInvitationDto as CreateInvitationPayload,
} from '@todo/shared';

export class CreateInvitationDto extends createZodDto(createInvitationSchema) {}
export interface CreateInvitationDto extends CreateInvitationPayload {}
