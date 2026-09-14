import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

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


@Module({
  imports: [
    // TypeOrmModule.forRoot({
    //   type: 'postgres', // TODO:
    //   host: 'localhost', // TODO:
    //   port: 5432, // TODO: make this configurable via environment variables
    //   username: 'postgres', // TODO: make this configurable via environment variables
    //   password: 'postgres', // TODO: make this configurable via environment variables
    //   database: 'todo_app', // TODO: make this configurable via environment variables
    //   autoLoadEntities: true, // automatically loads entities registered with forFeature()
    //   synchronize: true, // set to false in production to avoid data loss!
    //   // namingStrategy: new (require('typeorm-naming-strategies').SnakeNamingStrategy)(), // use snake_case for table and column names
    // }),
    TypeOrmModule.forRootAsync({
      useFactory: () => ({
        type: 'postgres',
        url: process.env.DATABASE_URL, // Use DATABASE_URL from environment variables
        autoLoadEntities: true,
        synchronize: true, // set to false in production to avoid data loss!
        // namingStrategy: new (require('typeorm-naming-strategies').SnakeNamingStrategy)(), // use snake_case for table and column names
      }),
    }),

    AuthModule,
    TaskModule,
    TaskLabelModule,
    ProjectModule,
    UserModule,
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
  ],
})
export class AppModule {}
