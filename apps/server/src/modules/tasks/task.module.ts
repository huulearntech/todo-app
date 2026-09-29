import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { SectionModule } from "../sections/section.module";

import { Task } from "./entities/task.entity";
import { TaskRecurrence } from "./entities/task-recurrence.entity";
import { TaskOccurence } from "./entities/task-occurence.entity";

import { TaskService } from "./services/task.service";
import { TaskRecurrenceService } from "./services/task-recurrence.service";
import { TaskOccurenceService } from "./services/task-occurence.service";

import { TasksController } from "./controllers/task.controller";

@Module({
  imports: [
    TypeOrmModule.forFeature([Task, TaskRecurrence, TaskOccurence]),
    SectionModule,
  ],
  controllers: [TasksController],
  providers: [
    TaskService,
    TaskRecurrenceService,
    TaskOccurenceService,
  ],
  exports: [TaskService],
})
export class TaskModule {}