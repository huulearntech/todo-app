import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Project } from './project.entity';
import { ProjectMember } from './entities/project-member.entity';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { User } from '../users/user.entity';
import { ProjectFilterDto } from './dto/project-filter.dto';
import { ProjectRole } from '@todo/shared';
import { ProjectAccessService } from './authorization/project-access.service';
import { ColorService } from '../colors/color.service';

@Injectable()
export class ProjectService {
  constructor(
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
    @InjectRepository(ProjectMember)
    private readonly memberRepository: Repository<ProjectMember>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly projectAccessService: ProjectAccessService,
  ) {}

  async createProject(
    ownerId: string,
    createProjectDto: CreateProjectDto,
  ): Promise<Project> {
    const { name, description, colorKey } = createProjectDto;
    const key = ColorService.resolveColor(colorKey, 'slate');

    const project = this.projectRepository.create({
      ownerId,
      name: name.trim(),
      description: description?.trim(),
      colorKey: key,
    });

    const saved = await this.projectRepository.save(project);

    // Ensure the project owner is recorded as an OWNER member
    const member = this.memberRepository.create({
      projectId: saved.id,
      userId: ownerId,
      role: ProjectRole.OWNER,
    });
    await this.memberRepository.save(member);

    return (await this.getProjectById(saved.id)) ?? saved;
  }

  async getProjectsForUser(
    userId: string,
    filter: ProjectFilterDto,
  ): Promise<Project[]> {
    return this.projectRepository.manager.transaction(
      async (transactionalEntityManager) => {
        await transactionalEntityManager.query(
          'SET LOCAL pg_trgm.similarity_threshold = 0.2;',
        );

        const queryBuilder = transactionalEntityManager
          .createQueryBuilder(Project, 'project')
          .innerJoin(
            ProjectMember,
            'pm',
            'pm.projectId = project.id AND pm.userId = :userId',
            { userId },
          )
          .leftJoinAndSelect('project.members', 'members')
          .leftJoinAndSelect('members.user', 'member_user');

        if (filter.scope === 'owned') {
          queryBuilder.andWhere('pm.role = :ownerRole', {
            ownerRole: ProjectRole.OWNER,
          });
        } else if (filter.scope === 'shared') {
          queryBuilder.andWhere('pm.role != :ownerRole', {
            ownerRole: ProjectRole.OWNER,
          });
        }

        if (filter.isDefault !== undefined) {
          queryBuilder.innerJoin(User, 'user', 'user.id = :userId', { userId });
          if (filter.isDefault) {
            queryBuilder.andWhere('project.id = user.defaultProjectId');
          } else {
            queryBuilder.andWhere('project.id != user.defaultProjectId');
          }
        }

        if (filter.name) {
          queryBuilder.andWhere('project.name % :name', { name: filter.name });
          queryBuilder.orderBy('similarity(project.name, :name)', 'DESC');
        } else {
          queryBuilder.orderBy('project.createdAt', 'DESC');
        }

        return queryBuilder.getMany();
      },
    );
  }

  async getProjectsByOwnerIdAndFilter(
    ownerId: string,
    filter: ProjectFilterDto,
  ): Promise<Project[]> {
    return this.getProjectsForUser(ownerId, filter);
  }

  async getProjectById(
    id: string,
    userId?: string,
  ): Promise<Project | null> {
    if (userId) {
      const role = await this.projectAccessService.getRole(userId, id);
      if (!role) {
        return null;
      }
    }

    return this.projectRepository.findOne({
      where: { id },
      relations: {
        members: {
          user: true,
        },
      },
      order: {
        members: {
          createdAt: 'ASC',
        },
      },
    });
  }

  async updateProject(
    id: string,
    updatedProject: Partial<UpdateProjectDto>,
    userId?: string,
  ): Promise<Project> {
    if (userId) {
      await this.projectAccessService.assertCan(userId, id, 'project:update');
    }

    const project = await this.getProjectById(id, userId);
    if (!project) {
      throw new NotFoundException('Project not found');
    }

    if (updatedProject.name !== undefined) {
      project.name = updatedProject.name.trim();
    }

    if (updatedProject.description !== undefined) {
      project.description = updatedProject.description?.trim();
    }

    if (updatedProject.colorKey !== undefined) {
      project.colorKey = ColorService.resolveColor(updatedProject.colorKey);
    }

    await this.projectRepository.save(project);
    return (await this.getProjectById(id, userId)) ?? project;
  }

  async deleteProject(id: string, userId: string): Promise<void> {
    await this.projectAccessService.assertCan(userId, id, 'project:delete');

    const user = await this.userRepository.findOne({
      where: { id: userId },
    });
    if (user && user.defaultProjectId === id) {
      throw new ConflictException('Cannot delete default inbox project');
    }

    const project = await this.projectRepository.findOne({
      where: { id },
    });
    if (!project) {
      throw new NotFoundException('Project not found');
    }
    await this.projectRepository.delete({ id });
  }
}
