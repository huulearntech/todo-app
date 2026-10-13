import { Injectable, BadRequestException } from '@nestjs/common';
import { TypedConfigService } from '../../config/typed-config.service';
import { v2 as cloudinary, type SignApiOptions } from 'cloudinary';

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

export interface ImageUrlOptions {
  width?: number;
  height?: number;
}

@Injectable()
export class ImageStorageService {
  private readonly cloudName: string;
  private readonly apiKey: string;
  private readonly apiSecret: string;

  constructor(private readonly configService: TypedConfigService) {
    this.cloudName = this.configService.get('CLOUDINARY_CLOUD_NAME');
    this.apiKey = this.configService.get('CLOUDINARY_API_KEY');
    this.apiSecret = this.configService.get('CLOUDINARY_API_SECRET');

    cloudinary.config({
      cloud_name: this.cloudName,
      api_key: this.apiKey,
      api_secret: this.apiSecret,
    });
  }

  async getUploadSignature(
    userId: string,
  ): Promise<SignedUploadSignatureResponse> {
    const timestamp = Math.floor(Date.now() / 1000);
    const folder = 'avatars';

    const paramsToSign: SignApiOptions = {
      folder,
      timestamp,
      allowed_formats: 'jpg,png,webp',
      public_id: userId,
      overwrite: true,
    };

    const signature = cloudinary.utils.api_sign_request(
      paramsToSign,
      this.apiSecret,
    );

    const uploadUrl = `https://api.cloudinary.com/v1_1/${this.cloudName}/image/upload`;

    return {
      signature,
      timestamp,
      cloudName: this.cloudName,
      apiKey: this.apiKey,
      folder,
      uploadUrl,
      publicId: userId,
    };
  }

  getImageUrl(publicId: string, options?: ImageUrlOptions): string {
    if (!publicId) {
      throw new BadRequestException('Image public_id is required');
    }
    return cloudinary.url(publicId, {
      secure: true,
      ...options,
    });
  }
}
