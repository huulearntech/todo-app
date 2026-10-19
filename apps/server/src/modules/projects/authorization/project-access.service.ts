import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { ProjectMember } from '../entities/project-member.entity';
import { ProjectRole } from '@todo/shared';
import { ProjectAction, roleCan } from './project-permissions';

@Injectable()
export class ProjectAccessService {
  constructor(
    @InjectRepository(ProjectMember)
    private readonly memberRepository: Repository<ProjectMember>,
  ) {}

  async getRole(
    userId: string,
    projectId: string,
  ): Promise<ProjectRole | null> {
    const member = await this.memberRepository.findOne({
      where: { projectId, userId },
      select: { role: true },
    });

    return member?.role ?? null;
  }

  async assertCan(
    userId: string,
    projectId: string,
    action: ProjectAction,
  ): Promise<ProjectRole> {
    const role = await this.getRole(userId, projectId);

    if (!role) {
      // Conceal existence to prevent enumeration (IDOR protection)
      throw new NotFoundException('Project not found');
    }

    if (!roleCan(role, action)) {
      throw new ForbiddenException(
        `Insufficient permissions for action: ${action}`,
      );
    }

    return role;
  }

  applyMembershipScope<T extends object>(
    queryBuilder: SelectQueryBuilder<T>,
    projectAlias: string,
    userId: string,
    memberAlias = 'pm_access',
  ): SelectQueryBuilder<T> {
    return queryBuilder.innerJoin(
      ProjectMember,
      memberAlias,
      `${memberAlias}.projectId = ${projectAlias}.id AND ${memberAlias}.userId = :accessUserId`,
      { accessUserId: userId },
    );
  }
}
