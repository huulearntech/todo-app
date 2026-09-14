import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { User } from "./user.entity";
import { Task } from "../tasks/task.entity";
import { UserService } from "./user.service";
import { UserController } from "./user.controller";
import { TaskModule } from "../tasks/task.module";
import { ProjectModule } from "../projects/project.module";
import { Project } from "../projects/project.entity";

@Module({
  imports: [TypeOrmModule.forFeature([User, Task, Project]), TaskModule, ProjectModule],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}