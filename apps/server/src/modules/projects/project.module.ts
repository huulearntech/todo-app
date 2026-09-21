import { Module } from "@nestjs/common";
import { ProjectController } from "./project.controller";
import { ProjectService } from "./project.service";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Project } from "./project.entity";
import { Task } from "../tasks/task.entity";
import { TaskModule } from "../tasks/task.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([Project, Task]),
    TaskModule,
  ],
  controllers: [ProjectController],
  providers: [ProjectService],
  exports: [ProjectService],
})
export class ProjectModule {}