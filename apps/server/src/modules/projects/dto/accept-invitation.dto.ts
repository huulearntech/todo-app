import { createZodDto } from 'nestjs-zod';
import {
  acceptInvitationSchema,
  type AcceptInvitationDto as AcceptInvitationPayload,
} from '@todo/shared';

export class AcceptInvitationDto extends createZodDto(acceptInvitationSchema) {}
export interface AcceptInvitationDto extends AcceptInvitationPayload {}
