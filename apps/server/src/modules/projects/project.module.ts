import { Module } from "@nestjs/common";
import { ProjectController } from "./project.controller";
import { ProjectService } from "./project.service";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Project } from "./project.entity";

@Module({
  imports: [TypeOrmModule.forFeature([Project])], // Import the Task entity for use in this module
  controllers: [ProjectController],
  providers: [ProjectService],
  exports: [ProjectService],
})
export class ProjectModule {}