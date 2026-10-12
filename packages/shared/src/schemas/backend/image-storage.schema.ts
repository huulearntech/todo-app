import { z } from "zod";

export const getUploadSignatureQuerySchema = z.object({});
export type GetUploadSignatureQueryDto = z.infer<
  typeof getUploadSignatureQuerySchema
>;

export const deleteImageQuerySchema = z.object({
  publicId: z.string().trim().min(1, "publicId is required").max(255),
});
export type DeleteImageQueryDto = z.infer<typeof deleteImageQuerySchema>;

export const getImageUrlQuerySchema = z.object({
  width: z.coerce.number().int().min(1).max(4000).optional(),
  height: z.coerce.number().int().min(1).max(4000).optional(),
});
export type GetImageUrlQueryDto = z.infer<typeof getImageUrlQuerySchema>;
