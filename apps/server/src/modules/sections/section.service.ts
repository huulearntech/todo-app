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

@Injectable()
export class SectionService {
  constructor(
    @InjectRepository(Section)
    private readonly sectionRepository: Repository<Section>,
  ) {}

  async createSection(
    ownerId: string,
    createSectionDto: CreateSectionDto,
  ): Promise<Section> {
    const { projectId, name, description, colorKey } = createSectionDto;
    const sectionId = randomUUID();

    try {
      const [raw] = await this.sectionRepository.query(
        `
          SELECT *
          FROM create_section(
            $1::uuid,
            $2::uuid,
            $3::uuid,
            $4::text,
            $5::text,
            $6::text
          );
        `,
        [
          ownerId,
          sectionId,
          projectId,
          name,
          description ?? '',
          colorKey ? colorKey.toLowerCase().trim() : null,
        ],
      );

      return this.sectionRepository.create({
        id: raw.id,
        projectId: raw.project_id ?? raw.projectId,
        ownerId: raw.owner_id ?? raw.ownerId,
        name: raw.name,
        description: raw.description,
        colorKey: raw.color_key ?? raw.colorKey,
        lexorank: raw.lexorank,
        createdAt: raw.created_at ?? raw.createdAt,
        updatedAt: raw.updated_at ?? raw.updatedAt,
      });
    } catch (error: unknown) {
      handleDatabaseOrderingError(error);
    }
  }

  // TODO: Returning the whole entity should be prohibited. use a DTO instead. @Cleanup @Robustness
  async getMySections(
    ownerId: string,
    filter: SectionFilterDto,
  ): Promise<Section[]> {
    const queryBuilder = this.sectionRepository
      .createQueryBuilder('section')
      .innerJoin('section.project', 'project', 'project.ownerId = :ownerId', {
        ownerId,
      });

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
    ownerId: string,
    id: string,
    updatedSection: Partial<Section>,
  ): Promise<Section> {
    const section = await this.sectionRepository.findOne({
      where: { id, project: { ownerId } },
    });
    if (!section) {
      throw new NotFoundException('Section not found');
    }
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
    try {
      await this.sectionRepository.query(
        `
          SELECT move_section(
            $1::uuid,
            $2::uuid,
            $3::uuid
          );
        `,
        [ownerId, id, prevId ?? null],
      );
    } catch (error: unknown) {
      handleDatabaseOrderingError(error);
    }
  }

  async deleteSection(ownerId: string, id: string): Promise<void> {
    const section = await this.sectionRepository.findOne({
      where: { id, project: { ownerId } },
    });
    if (!section) {
      throw new NotFoundException('Section not found');
    }
    await this.sectionRepository.delete({ id });
  }
}
