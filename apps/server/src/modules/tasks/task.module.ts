import { Module } from "@nestjs/common";
import { TasksController } from "./task.controller";
import { TaskService } from "./task.service";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Task } from "./task.entity";
import { Section } from "../sections/section.entity";

@Module({
  imports: [TypeOrmModule.forFeature([Task, Section])],
  controllers: [TasksController],
  providers: [TaskService],
  exports: [TaskService],
})
export class TaskModule {}