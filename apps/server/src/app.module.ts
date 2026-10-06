import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_PIPE } from '@nestjs/core';
import { BullModule } from '@nestjs/bullmq';

import { AppConfigModule } from './config/config.module';
import { TypedConfigService } from './config/typed-config.service';

import { AppController } from './app.controller';
import { AppService } from './app.service';

import { AuthModule } from './modules/auth/auth.module';
import { TaskModule } from './modules/tasks/task.module';
import { UserModule } from './modules/users/user.module';
import { ImageStorageModule } from './modules/image_storage/image_storage.module';
import { TaskLabelModule } from './modules/task-labels/task-label.module';
import { ProjectModule } from './modules/projects/project.module';
import { SectionModule } from './modules/sections/section.module';
import { ColorModule } from './modules/colors/color.module';
import { MailerModule } from './modules/mailer/mailer.module';

import { ZodValidationPipe } from 'nestjs-zod';

import { migrations } from './migrations';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      useFactory: () => ({
        type: 'postgres',
        url: process.env.DATABASE_URL,
        autoLoadEntities: true,
        synchronize: true, // set to false in production to avoid data loss!
        migrations,
        migrationsRun: true,
      }),
    }),

    BullModule.forRootAsync({
      imports: [AppConfigModule],
      useFactory: (configService: TypedConfigService) => ({
        connection: {
          host: configService.get('REDIS_HOST') || 'localhost',
          port: configService.get('REDIS_PORT') || 6379,
          password: configService.get('REDIS_PASSWORD') || undefined,
        },
      }),
      inject: [TypedConfigService],
    }),

    AuthModule,
    TaskModule,
    TaskLabelModule,
    ProjectModule,
    SectionModule,
    ColorModule,
    UserModule,
    MailerModule,
    ImageStorageModule.register(),
    AppConfigModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_PIPE,
      useClass: ZodValidationPipe,
    },
  ],
})
export class AppModule {}
