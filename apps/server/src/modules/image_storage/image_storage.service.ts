import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import type { IImageStorageProvider } from './interfaces/image-storage.interface';
import {
  IMAGE_STORAGE_PROVIDER,
  SignedUploadSignatureResponse,
} from './interfaces/image-storage.interface';

@Injectable()
export class ImageStorageService {
  constructor(
    @Inject(IMAGE_STORAGE_PROVIDER)
    private readonly storageProvider: IImageStorageProvider,
  ) {}

  async getUploadSignature(
    folder: string = 'products',
    publicId?: string,
  ): Promise<SignedUploadSignatureResponse> {
    return this.storageProvider.generateUploadSignature(folder, publicId);
  }

  async deleteImage(publicId: string): Promise<boolean> {
    if (!publicId) {
      throw new BadRequestException('Image public_id is required');
    }
    return this.storageProvider.deleteFile(publicId);
  }

  async getImageUrl(publicId: string, options?: any): Promise<string> {
    if (!publicId) {
      throw new BadRequestException('Image public_id is required');
    }
    return this.storageProvider.getImageUrl(publicId, options);
  }
}
