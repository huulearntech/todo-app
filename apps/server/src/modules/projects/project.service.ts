import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Project } from './project.entity';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { User } from '../users/user.entity';
import { ProjectFilterDto } from './dto/project-filter.dto';
import { ColorService, normalizeHexCode } from '../colors/color.service';
import { Color } from '../colors/color.entity';

@Injectable()
export class ProjectService {
  constructor(
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
    private readonly colorService: ColorService,
  ) {}

  async createProject(
    ownerId: string,
    createProjectDto: CreateProjectDto,
  ): Promise<Project> {
    const { name, description, colorHexCode } = createProjectDto;
    const hexCode = colorHexCode || '#E0E0E0';
    const normalizedHex = normalizeHexCode(hexCode);

    let targetColor: Color | undefined;
    if (normalizedHex === '#E0E0E0') {
      const defaultColors =
        await this.colorService.ensureDefaultColors(ownerId);
      targetColor = defaultColors.find((c) => c.hexCode === '#E0E0E0');
    } else {
      targetColor = await this.colorService.getColorByHexCode(
        ownerId,
        normalizedHex,
      );
    }

    const project = this.projectRepository.create({
      ownerId,
      name: name.trim(),
      description: description?.trim(),
      colorHexCode: normalizedHex,
      ...(targetColor ? { color: targetColor } : {}),
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

  async getProjectById(id: string): Promise<Project | null> {
    return this.projectRepository.findOne({
      where: { id },
      relations: { color: true },
    });
  }

  async updateProject(
    id: string,
    updatedProject: Partial<UpdateProjectDto>,
    ownerId?: string,
  ): Promise<Project | null> {
    const project = await this.getProjectById(id);
    if (!project) {
      return null;
    }

    if (ownerId && project.ownerId !== ownerId) {
      return null;
    }

    if (updatedProject.name !== undefined) {
      project.name = updatedProject.name.trim();
    }

    if (updatedProject.description !== undefined) {
      project.description = updatedProject.description?.trim();
    }

    if (updatedProject.colorHexCode !== undefined) {
      const normalizedHex = normalizeHexCode(updatedProject.colorHexCode);
      let targetColor: Color | undefined;
      if (normalizedHex === '#E0E0E0') {
        const defaultColors = await this.colorService.ensureDefaultColors(
          project.ownerId,
        );
        targetColor = defaultColors.find((c) => c.hexCode === '#E0E0E0');
      } else {
        targetColor = await this.colorService.getColorByHexCode(
          project.ownerId,
          normalizedHex,
        );
      }
      project.colorHexCode = normalizedHex;
      if (targetColor) {
        project.color = targetColor;
      }
    }

    await this.projectRepository.save(project);
    return this.getProjectById(id);
  }

  async deleteProject(id: string): Promise<boolean> {
    const result = await this.projectRepository.delete({ id });
    return result.affected !== 0;
  }
}
