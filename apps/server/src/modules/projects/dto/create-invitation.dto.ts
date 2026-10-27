import { createZodDto } from 'nestjs-zod';
import { createInvitationSchema } from '@todo/shared';

export class CreateInvitationDto extends createZodDto(createInvitationSchema) {}
