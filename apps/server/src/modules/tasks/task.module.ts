import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SectionModule } from '../sections/section.module';

import { Task } from './entities/task.entity';
import { TaskRecurrence } from './entities/task-recurrence.entity';
import { TaskOccurrence } from './entities/task-occurrence.entity';

import { TaskService } from './services/task.service';
import { TaskRecurrenceService } from './services/task-recurrence.service';

import { TasksController } from './controllers/task.controller';

import { MailerModule } from '../mailer/mailer.module';

import { User } from '../users/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Task, TaskRecurrence, TaskOccurrence, User]),
    SectionModule,
    MailerModule,
  ],
  controllers: [TasksController],
  providers: [TaskService, TaskRecurrenceService],
  exports: [TaskService, TypeOrmModule],
})
export class TaskModule {}
