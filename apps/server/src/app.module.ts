import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_PIPE } from '@nestjs/core';

// import { BullModule } from '@nestjs/bullmq';

// import { ConfigModule } from '@nestjs/config';
import { AppConfigModule } from './config/config.module';

import { AppController } from './app.controller';
import { AppService } from './app.service';

import { AuthModule } from './modules/auth/auth.module';
import { TaskModule } from './modules/tasks/task.module';
import { UserModule } from './modules/users/user.module';
import { ImageStorageModule } from './modules/image_storage/image_storage.module';
import { TaskLabelModule } from './modules/task-labels/task-label.module';
import { ProjectModule } from './modules/projects/project.module';
import { SectionModule } from './modules/sections/section.module';
// import { MailerModule } from './modules/mailer/mailer.module';


import { ZodValidationPipe } from 'nestjs-zod';


@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      useFactory: () => ({
        type: 'postgres',
        url: process.env.DATABASE_URL,
        autoLoadEntities: true,
        synchronize: true, // set to false in production to avoid data loss!
      }),
    }),

    AuthModule,
    TaskModule,
    TaskLabelModule,
    ProjectModule,
    SectionModule,
    UserModule,
    // MailerModule,
    ImageStorageModule.register(), // Register the ImageStorageModule with its dynamic configuration

    // ConfigModule.forRoot({
    //   validate,
    //   isGlobal: true, // makes ConfigModule available globally without needing to import it in other modules
    // }),
    AppConfigModule, // Wrapper module for ConfigModule with validation, set as global
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_PIPE,
      useClass: ZodValidationPipe, // Global validation pipe for DTOs
    }
  ],
})
export class AppModule {}
