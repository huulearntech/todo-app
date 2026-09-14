export interface SignedUploadSignatureResponse {
  signature: string;
  timestamp: number;
  cloudName: string;
  apiKey: string;
  folder: string;
  uploadUrl: string;
  eager?: string;
  publicId?: string;
}

export interface ImageStorageOptions {
  folder?: string;
  publicId?: string;
  allowedMimeTypes?: string[];
  maxFileSizeByte?: number;
}

export const IMAGE_STORAGE_PROVIDER = 'IMAGE_STORAGE_PROVIDER';

export interface IImageStorageProvider {
  /**
   * Generates a signed upload token / signature for direct client-to-provider upload.
   */
  generateUploadSignature(
    folder?: string,
    publicId?: string,
  ): Promise<SignedUploadSignatureResponse>;

  /**
   * Deletes a file from the provider using publicId.
   */
  deleteFile(publicId: string): Promise<boolean>;

  /**
   * Generates or formats image URL for display.
   */
  getImageUrl(publicId: string, options?: any): Promise<string>;
}
