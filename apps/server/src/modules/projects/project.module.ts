import { Module } from '@nestjs/common';
import { ProjectController } from './project.controller';
import { ProjectService } from './project.service';
import { ProjectMemberController } from './project-member.controller';
import { ProjectMemberService } from './project-member.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Project } from './project.entity';
import { ProjectMember } from './entities/project-member.entity';
import { ProjectInvitation } from './entities/project-invitation.entity';
import { TaskModule } from '../tasks/task.module';
import { SectionModule } from '../sections/section.module';
import { ProjectAccessModule } from './authorization/project-access.module';
import { MailerModule } from '../mailer/mailer.module';

import { User } from '../users/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Project, ProjectMember, ProjectInvitation, User]),
    TaskModule,
    SectionModule,
    ProjectAccessModule,
    MailerModule,
  ],
  controllers: [ProjectController, ProjectMemberController],
  providers: [ProjectService, ProjectMemberService],
  exports: [ProjectService, ProjectMemberService, ProjectAccessModule],
})
export class ProjectModule {}
