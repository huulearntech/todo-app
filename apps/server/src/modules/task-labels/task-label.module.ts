import { Module } from '@nestjs/common';
import { TaskLabelController } from './task-label.controller';
import { TaskLabelService } from './task-label.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TaskLabel } from './task-label.entity';
import { Task } from '../tasks/entities/task.entity';
import { TaskModule } from '../tasks/task.module';
import { ColorModule } from '../colors/color.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([TaskLabel, Task]),
    TaskModule,
    ColorModule,
  ],
  controllers: [TaskLabelController],
  providers: [TaskLabelService],
  exports: [TaskLabelService],
})
export class TaskLabelModule {}
