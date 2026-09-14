import { Module } from "@nestjs/common";
import { TasksController } from "./task.controller";
import { TaskService } from "./task.service";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Task } from "./task.entity";

@Module({
  imports: [TypeOrmModule.forFeature([Task])], // Import the Task entity for use in this module
  controllers: [TasksController],
  providers: [TaskService],
  exports: [TaskService],
})
export class TaskModule {}