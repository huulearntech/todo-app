import { Module } from "@nestjs/common";
import { TaskLabelController } from "./task-label.controller";
import { TaskLabelService } from "./task-label.service";
import { TypeOrmModule } from "@nestjs/typeorm";
import { TaskLabel } from "./task-label.entity";

@Module({
  imports: [TypeOrmModule.forFeature([TaskLabel])], // Import the Task entity for use in this module
  controllers: [TaskLabelController],
  providers: [TaskLabelService],
  exports: [TaskLabelService],
})
export class TaskLabelModule {}