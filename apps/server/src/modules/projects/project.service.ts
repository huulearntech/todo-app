import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Project } from './project.entity';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { User } from '../users/user.entity';
import { ProjectFilterDto } from './dto/project-filter.dto';

import { ColorService } from '../colors/color.service';

@Injectable()
export class ProjectService {
  constructor(
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
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
    return (await this.getProjectById(saved.id)) ?? saved;
  }

  async getProjectsByOwnerIdAndFilter(
    ownerId: string,
    filter: ProjectFilterDto,
  ): Promise<Project[]> {
    // TODO: pagination
    return this.projectRepository.manager.transaction(
      async (transactionalEntityManager) => {
        await transactionalEntityManager.query(
          'SET LOCAL pg_trgm.similarity_threshold = 0.2;',
        );

        const queryBuilder = transactionalEntityManager
          .createQueryBuilder(Project, 'project')
          .leftJoinAndSelect('project.color', 'color')
          .where('project.ownerId = :ownerId', { ownerId });

        if (filter.isDefault !== undefined) {
          queryBuilder.innerJoin(User, 'user', 'user.id = project.ownerId');
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

  async getProjectById(id: string, ownerId?: string): Promise<Project | null> {
    return this.projectRepository.findOne({
      where: ownerId ? { id, ownerId } : { id },
    });
  }

  async updateProject(
    id: string,
    updatedProject: Partial<UpdateProjectDto>,
    ownerId?: string,
  ): Promise<Project> {
    const project = await this.getProjectById(id, ownerId);
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
    return (await this.getProjectById(id, ownerId)) ?? project;
  }

  async deleteProject(id: string, ownerId: string): Promise<void> {
    const user = await this.userRepository.findOne({ where: { id: ownerId } });
    if (user && user.defaultProjectId === id) {
      throw new ConflictException('Cannot delete default inbox project');
    }

    const project = await this.projectRepository.findOne({
      where: { id, ownerId },
    });
    if (!project) {
      throw new NotFoundException('Project not found');
    }
    await this.projectRepository.delete({ id });
  }
}
