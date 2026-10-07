import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ProductivityController } from './productivity.controller';
import { ProductivityService } from './productivity.service';
import { Task } from '../tasks/entities/task.entity';
import { TaskOccurrence } from '../tasks/entities/task-occurrence.entity';
import { UserGoal } from '../users/entities/user-goal.entity';
import { User } from '../users/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Task, TaskOccurrence, UserGoal, User])],
  controllers: [ProductivityController],
  providers: [ProductivityService],
  exports: [ProductivityService],
})
export class ProductivityModule {}
