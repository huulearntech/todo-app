import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProjectMember } from '../entities/project-member.entity';
import { ProjectAccessService } from './project-access.service';
import { ProjectRoleGuard } from './guards/project-role.guard';

@Module({
  imports: [TypeOrmModule.forFeature([ProjectMember])],
  providers: [ProjectAccessService, ProjectRoleGuard],
  exports: [ProjectAccessService, ProjectRoleGuard, TypeOrmModule],
})
export class ProjectAccessModule {}
