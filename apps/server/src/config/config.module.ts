import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { validate } from './env.validation';
import { TypedConfigService } from './typed-config.service';

@Global()
@Module({
  imports: [
    ConfigModule.forRoot({
      validate,
      cache: true, // Improves performance by caching parsed variables in-memory
    }),
  ],
  providers: [TypedConfigService],
  exports: [TypedConfigService], // Export it so other modules can use it
})
export class AppConfigModule {}