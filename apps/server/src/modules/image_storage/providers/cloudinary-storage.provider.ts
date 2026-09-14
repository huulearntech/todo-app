import { Injectable, BadRequestException } from '@nestjs/common';
import { TypedConfigService } from '../../../config/typed-config.service';
import { v2 as cloudinary } from 'cloudinary';
import {
  IImageStorageProvider,
  SignedUploadSignatureResponse,
} from '../interfaces/image-storage.interface';

@Injectable()
export class CloudinaryStorageProvider implements IImageStorageProvider {
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

  async generateUploadSignature(
    folder: string = 'products',
    publicId?: string,
  ): Promise<SignedUploadSignatureResponse> {
    const timestamp = Math.floor(Date.now() / 1000);

    // TODO: remove 'any'.
    const paramsToSign: Record<string, unknown> = {
      folder,
      timestamp,
    };

    if (publicId) {
      paramsToSign.public_id = publicId;
    }

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
      publicId,
    };
  }

  async deleteFile(publicId: string): Promise<boolean> {
    try {
      const result = await cloudinary.uploader.destroy(publicId);
      return result.result === 'ok';
    } catch (error) {
      throw new BadRequestException(`Failed to delete image: ${error}`);
    }
  }

  async getImageUrl(publicId: string, options?: any): Promise<string> {
    return cloudinary.url(publicId, {
      secure: true,
      ...options,
    });
  }
}
