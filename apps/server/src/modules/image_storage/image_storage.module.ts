import { Module, DynamicModule, Provider } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ImageStorageService } from './image_storage.service';
import { ImageStorageController } from './image_storage.controller';
import { IMAGE_STORAGE_PROVIDER } from './interfaces/image-storage.interface';
import { CloudinaryStorageProvider } from './providers/cloudinary-storage.provider';
import { TypedConfigService } from '../../config/typed-config.service';

@Module({})
export class ImageStorageModule {
  static register(): DynamicModule {
    const storageProvider: Provider = {
      provide: IMAGE_STORAGE_PROVIDER,
      useFactory: (configService: TypedConfigService) => {
        return new CloudinaryStorageProvider(configService);
      },
      inject: [TypedConfigService],
    };

    return {
      module: ImageStorageModule,
      imports: [ConfigModule],
      controllers: [ImageStorageController],
      providers: [storageProvider, ImageStorageService],
      exports: [ImageStorageService],
    };
  }
}
