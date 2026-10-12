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
import {
  DeleteImageQueryDto,
  GetImageUrlQueryDto,
  GetUploadSignatureQueryDto,
} from './dto/image-storage.dto';

@Controller('image-storage')
export class ImageStorageController {
  constructor(private readonly imageStorageService: ImageStorageService) {}

  /**
   * Client requests signed credentials to upload directly to Cloudinary
   */
  @Post('signature')
  async getUploadSignature(@Query() query: GetUploadSignatureQueryDto) {
    return this.imageStorageService.getUploadSignature(
      query.folder,
      query.publicId,
    );
  }

  @Delete()
  async deleteImage(@Query() query: DeleteImageQueryDto) {
    const success = await this.imageStorageService.deleteImage(query.publicId);
    return { success, publicId: query.publicId };
  }

  @Get('url/*path')
  async getImageUrl(
    @Param('0') publicId: string,
    @Query() query: GetImageUrlQueryDto,
  ) {
    if (!publicId) {
      throw new BadRequestException('publicId is required');
    }
    const options: { width?: number; height?: number } = {};
    if (query.width) options.width = query.width;
    if (query.height) options.height = query.height;

    const url = await this.imageStorageService.getImageUrl(publicId, options);
    return { public_id: publicId, url };
  }
}
