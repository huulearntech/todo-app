import { createZodDto } from 'nestjs-zod';
import { acceptInvitationSchema } from '@todo/shared';

export class AcceptInvitationDto extends createZodDto(acceptInvitationSchema) {}
