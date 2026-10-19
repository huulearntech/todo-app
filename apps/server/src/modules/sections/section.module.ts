import { Module } from '@nestjs/common';
import { SectionController } from './section.controller';
import { SectionService } from './section.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Section } from './section.entity';
import { ProjectAccessModule } from '../projects/authorization/project-access.module';

@Module({
  imports: [TypeOrmModule.forFeature([Section]), ProjectAccessModule],
  controllers: [SectionController],
  providers: [SectionService],
  exports: [TypeOrmModule, SectionService],
})
export class SectionModule {}
