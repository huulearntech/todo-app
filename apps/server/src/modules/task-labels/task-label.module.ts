import { Module } from "@nestjs/common";
import { TaskLabelController } from "./task-label.controller";
import { TaskLabelService } from "./task-label.service";
import { TypeOrmModule } from "@nestjs/typeorm";
import { TaskLabel } from "./task-label.entity";
import { Task } from "../tasks/task.entity";
import { TaskModule } from "../tasks/task.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([TaskLabel, Task]),
    TaskModule,
  ],
  controllers: [TaskLabelController],
  providers: [TaskLabelService],
  exports: [TaskLabelService],
})
export class TaskLabelModule {}