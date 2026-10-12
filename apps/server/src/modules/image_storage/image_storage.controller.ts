import {
  Controller,
  Post,
  Get,
  Param,
  Query,
  BadRequestException,
} from '@nestjs/common';
import { ImageStorageService } from './image_storage.service';
import { GetImageUrlQueryDto } from './dto/image-storage.dto';
import {
  CurrentUser,
  type JwtUser,
} from '../auth/decorators/current-user.decorator';

@Controller('image-storage')
export class ImageStorageController {
  constructor(private readonly imageStorageService: ImageStorageService) {}

  /**
   * Client requests signed credentials to upload their avatar directly to Cloudinary
   */
  @Post('signature')
  async getUploadSignature(@CurrentUser() user: JwtUser) {
    return this.imageStorageService.getUploadSignature(user.id);
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
