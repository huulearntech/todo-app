import axios from 'axios';
import { apiClient } from '../lib/api-client';

export interface SignedUploadSignature {
  signature: string;
  timestamp: number;
  cloudName: string;
  apiKey: string;
  folder: string;
  uploadUrl: string;
  publicId?: string;
}

export interface UploadedImageResult {
  public_id: string;
  secure_url: string;
  format?: string;
  width?: number;
  height?: number;
  bytes?: number;
  folder?: string;
}

export const imageUploadService = {
  /**
   * Step 1: Request signed upload credentials from our server
   */
  async getUploadSignature(
    folder: string = 'products',
    publicId?: string,
  ): Promise<SignedUploadSignature> {
    const response = await apiClient.post<SignedUploadSignature>(
      `/image-storage/signature?folder=${encodeURIComponent(folder)}${publicId ? `&publicId=${encodeURIComponent(publicId)}` : ''
      }`,
    );
    return response.data;
  },

  /**
   * Step 2: Upload a single image file directly from client browser to Cloudinary
   */
  async uploadImageDirectToCloudinary(
    file: File,
    signatureData: SignedUploadSignature,
  ): Promise<UploadedImageResult> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('api_key', signatureData.apiKey);
    formData.append('timestamp', signatureData.timestamp.toString());
    formData.append('signature', signatureData.signature);
    formData.append('folder', signatureData.folder);

    if (signatureData.publicId) {
      formData.append('public_id', signatureData.publicId);
    }

    // Direct upload to Cloudinary API (without passing through application server)
    const response = await axios.post<UploadedImageResult>(
      signatureData.uploadUrl,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      },
    );

    return response.data;
  },

  /**
   * Concurrently upload multiple images directly to Cloudinary using signed requests
   */
  async uploadMultipleImagesDirect(
    files: File[],
    folder: string = 'products',
  ): Promise<UploadedImageResult[]> {
    // Concurrently request upload signatures for files
    // NOTE: Requesting multiple signatures at once can slowdown the
    // operation. Consider requesting signature on-the-fly
    const signaturePromises = files.map(() => imageUploadService.getUploadSignature(folder));
    const signatures = await Promise.all(signaturePromises);

    // Concurrently upload files directly to Cloudinary
    const uploadPromises = files.map((file, index) =>
      imageUploadService.uploadImageDirectToCloudinary(file, signatures[index]),
    );

    return Promise.all(uploadPromises);
  }
}