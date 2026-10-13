import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ImageStorageService } from './image_storage.service';
import { ImageStorageController } from './image_storage.controller';

@Module({
  imports: [ConfigModule],
  controllers: [ImageStorageController],
  providers: [ImageStorageService],
  exports: [ImageStorageService],
})
export class ImageStorageModule {}
