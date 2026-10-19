import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomUUID } from 'crypto';

import { Section } from './section.entity';
import {
  SectionFilterDto,
  type CreateSectionDto,
} from './dto/create-section.dto';
import { handleDatabaseOrderingError } from '../../common/utils/database-error.util';
import { ProjectAccessService } from '../projects/authorization/project-access.service';
import { ProjectMember } from '../projects/entities/project-member.entity';

@Injectable()
export class SectionService {
  constructor(
    @InjectRepository(Section)
    private readonly sectionRepository: Repository<Section>,
    private readonly projectAccessService: ProjectAccessService,
  ) {}

  async createSection(
    actingUserId: string,
    createSectionDto: CreateSectionDto,
  ): Promise<Section> {
    const { projectId, name, description, colorKey } = createSectionDto;
    await this.projectAccessService.assertCan(
      actingUserId,
      projectId,
      'section:create',
    );

    const sectionId = randomUUID();

    try {
      const section = this.sectionRepository.create({
        id: sectionId,
        projectId,
        ownerId: actingUserId,
        name,
        description: description ?? '',
        colorKey: colorKey ? colorKey.toLowerCase().trim() : null,
      });

      return await this.sectionRepository.save(section);
    } catch (error: unknown) {
      handleDatabaseOrderingError(error);
    }
  }

  // TODO: Returning the whole entity should be prohibited. use a DTO instead. @Cleanup @Robustness
  async getMySections(
    userId: string,
    filter: SectionFilterDto,
  ): Promise<Section[]> {
    const queryBuilder = this.sectionRepository
      .createQueryBuilder('section')
      .innerJoin(
        ProjectMember,
        'pm',
        'pm.projectId = section.projectId AND pm.userId = :userId',
        { userId },
      );

    if (filter.projectId) {
      queryBuilder.andWhere('section.projectId = :projectId', {
        projectId: filter.projectId,
      });
    }

    if (filter.name) {
      queryBuilder
        .andWhere('section.name % :name', { name: filter.name })
        .orderBy('similarity(section.name, :name)', 'DESC');
    } else {
      queryBuilder.orderBy('section.lexorank COLLATE "C"', 'ASC');
    }

    return queryBuilder
      .select([
        'section.id',
        'section.name',
        'section.description',
        'section.projectId',
        'section.colorKey',
      ])
      .getMany();
  }

  async getSectionById(id: string): Promise<Section | null> {
    return this.sectionRepository.findOne({ where: { id } });
  }

  async updateSection(
    userId: string,
    id: string,
    updatedSection: Partial<Section>,
  ): Promise<Section> {
    const section = await this.sectionRepository
      .createQueryBuilder('section')
      .innerJoin(
        ProjectMember,
        'pm',
        'pm.projectId = section.projectId AND pm.userId = :userId',
        { userId },
      )
      .where('section.id = :id', { id })
      .getOne();

    if (!section) {
      throw new NotFoundException('Section not found');
    }

    await this.projectAccessService.assertCan(
      userId,
      section.projectId,
      'section:update',
    );

    Object.assign(section, updatedSection);
    return this.sectionRepository.save(section);
  }

  async updateSectionOrder({
    ownerId,
    id,
    prevId,
  }: {
    ownerId: string;
    id: string;
    prevId: string | null;
  }): Promise<void> {
    const section = await this.sectionRepository
      .createQueryBuilder('section')
      .innerJoin(
        ProjectMember,
        'pm',
        'pm.projectId = section.projectId AND pm.userId = :userId',
        { userId: ownerId },
      )
      .where('section.id = :id', { id })
      .getOne();

    if (!section) {
      throw new NotFoundException('Section not found');
    }

    await this.projectAccessService.assertCan(
      ownerId,
      section.projectId,
      'section:update',
    );

    try {
      await this.sectionRepository.query(
        `
          SELECT move_section_lexorank(
            $1::uuid,
            $2::uuid
          );
        `,
        [id, prevId ?? null],
      );
    } catch (error: unknown) {
      handleDatabaseOrderingError(error);
    }
  }

  async deleteSection(userId: string, id: string): Promise<void> {
    const section = await this.sectionRepository
      .createQueryBuilder('section')
      .innerJoin(
        ProjectMember,
        'pm',
        'pm.projectId = section.projectId AND pm.userId = :userId',
        { userId },
      )
      .where('section.id = :id', { id })
      .getOne();

    if (!section) {
      throw new NotFoundException('Section not found');
    }

    await this.projectAccessService.assertCan(
      userId,
      section.projectId,
      'section:delete',
    );

    await this.sectionRepository.delete({ id });
  }
}
