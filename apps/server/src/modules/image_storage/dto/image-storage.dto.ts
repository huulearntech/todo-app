import { createZodDto } from 'nestjs-zod';
import {
  getUploadSignatureQuerySchema,
  type GetUploadSignatureQueryDto as GetUploadSignatureQueryPayload,
  getImageUrlQuerySchema,
  type GetImageUrlQueryDto as GetImageUrlQueryPayload,
} from '@todo/shared';

export class GetUploadSignatureQueryDto extends createZodDto(
  getUploadSignatureQuerySchema,
) {}
export interface GetUploadSignatureQueryDto extends GetUploadSignatureQueryPayload {}

export class GetImageUrlQueryDto extends createZodDto(getImageUrlQuerySchema) {}
export interface GetImageUrlQueryDto extends GetImageUrlQueryPayload {}
