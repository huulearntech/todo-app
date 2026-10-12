import { createZodDto } from 'nestjs-zod';
import {
  getUploadSignatureQuerySchema,
  type GetUploadSignatureQueryDto as GetUploadSignatureQueryPayload,
  deleteImageQuerySchema,
  type DeleteImageQueryDto as DeleteImageQueryPayload,
  getImageUrlQuerySchema,
  type GetImageUrlQueryDto as GetImageUrlQueryPayload,
} from '@todo/shared';

export class GetUploadSignatureQueryDto extends createZodDto(
  getUploadSignatureQuerySchema,
) {}
export interface GetUploadSignatureQueryDto
  extends GetUploadSignatureQueryPayload {}

export class DeleteImageQueryDto extends createZodDto(deleteImageQuerySchema) {}
export interface DeleteImageQueryDto extends DeleteImageQueryPayload {}

export class GetImageUrlQueryDto extends createZodDto(getImageUrlQuerySchema) {}
export interface GetImageUrlQueryDto extends GetImageUrlQueryPayload {}
