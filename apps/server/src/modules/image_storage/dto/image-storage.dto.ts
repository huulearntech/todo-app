import { createZodDto } from 'nestjs-zod';
import {
  getUploadSignatureQuerySchema,
  getImageUrlQuerySchema,
} from '@todo/shared';

export class GetUploadSignatureQueryDto extends createZodDto(
  getUploadSignatureQuerySchema,
) {}

export class GetImageUrlQueryDto extends createZodDto(getImageUrlQuerySchema) {}
