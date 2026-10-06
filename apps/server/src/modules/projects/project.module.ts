import { Module } from '@nestjs/common';
import { ProjectController } from './project.controller';
import { ProjectService } from './project.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Project } from './project.entity';
import { TaskModule } from '../tasks/task.module';
import { SectionModule } from '../sections/section.module';
import { ColorModule } from '../colors/color.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Project]),
    TaskModule,
    SectionModule,
    ColorModule,
  ],
  controllers: [ProjectController],
  providers: [ProjectService],
  exports: [ProjectService],
})
export class ProjectModule {}
