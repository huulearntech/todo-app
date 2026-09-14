import {
  Controller,
  Post,
  Delete,
  Get,
  Param,
  Query,
  BadRequestException,
} from '@nestjs/common';
import { ImageStorageService } from './image_storage.service';

@Controller('image-storage')
export class ImageStorageController {
  constructor(private readonly imageStorageService: ImageStorageService) {}

  /**
   * Client requests signed credentials to upload directly to Cloudinary
   */
  @Post('signature')
  async getUploadSignature(
    @Query('folder') folder?: string,
    @Query('publicId') publicId?: string,
  ) {
    return this.imageStorageService.getUploadSignature(folder, publicId);
  }

  @Delete()
  async deleteImage(@Query('publicId') publicId: string) {
    if (!publicId) {
      throw new BadRequestException('publicId query parameter is required');
    }
    const success = await this.imageStorageService.deleteImage(publicId);
    return { success, publicId };
  }

  @Get('url/*path')
  async getImageUrl(
    @Param('0') publicId: string,
    @Query('width') width?: string,
    @Query('height') height?: string,
  ) {
    if (!publicId) {
      throw new BadRequestException('publicId is required');
    }
    const options: any = {};
    if (width) options.width = parseInt(width, 10);
    if (height) options.height = parseInt(height, 10);

    const url = await this.imageStorageService.getImageUrl(publicId, options);
    return { public_id: publicId, url };
  }
}
