import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MoreThan, Repository } from 'typeorm';

import { Section } from './section.entity';
import { Project } from '../projects/project.entity';
import {
  SectionFilterDto,
  type CreateSectionDto,
} from './dto/create-section.dto';
import { Lexorank } from '../../common/utils/lexorank.util';

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
    const { projectId, name, description } = createSectionDto;
    const exists = await this.sectionRepository.manager.exists(Project, {
      where: { id: projectId, ownerId },
    });

    if (!exists) {
      throw new Error(
        'Project not found or you do not have permission to add a section to this project.',
      );
    }

    const sectionWithHighestLexorank = await this.sectionRepository.findOne({
      where: { projectId },
      select: { id: true, lexorank: true },
      order: { lexorank: 'DESC' },
    });

    const highestLexorank = sectionWithHighestLexorank?.lexorank || '';
    const newRank = Lexorank.getMidpoint(highestLexorank, ''); // passing '' means no upper limit

    const section = this.sectionRepository.create({
      projectId,
      name,
      description,
      lexorank: newRank,
    });
    return this.sectionRepository.save(section);
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
    }

    return queryBuilder
      .select([
        'section.id',
        'section.name',
        'section.description',
        'section.projectId',
      ])
      .orderBy('section.lexorank', 'ASC')
      .getMany();
  }

  async getSectionById(id: string): Promise<Section | null> {
    return this.sectionRepository.findOne({ where: { id } });
  }

  async updateSection(
    id: string,
    updatedSection: Partial<Section>,
  ): Promise<Section | null> {
    const section = await this.getSectionById(id);
    if (!section) {
      return null;
    }
    Object.assign(section, updatedSection);
    return this.sectionRepository.save(section);
  }

  // NOTE: this function might be optimizable.
  async updateSectionOrder({
    ownerId,
    id,
    prevId,
  }: {
    ownerId: string;
    id: string;
    prevId: string | null;
  }): Promise<void> {
    const sectionToMove = await this.sectionRepository.findOneOrFail({
      where: { id, project: { ownerId } },
      select: { id: true, lexorank: true, projectId: true },
    });

    if (!prevId) {
      // If prevId is null, it means the task is being moved to the top of the list.
      // So we need to find the first task in the section to get its lexorank.
      const firstSectionInProject = await this.sectionRepository.findOne({
        where: { projectId: sectionToMove.projectId },
        select: { id: true, lexorank: true },
        order: { lexorank: 'ASC' },
      });

      await this.sectionRepository.update(
        { id },
        {
          lexorank: Lexorank.getMidpoint(
            '',
            firstSectionInProject?.lexorank || '',
          ),
        },
      );
      return;
    }

    const prevSection = await this.sectionRepository.findOneOrFail({
      where: { id: prevId, projectId: sectionToMove.projectId },
      select: { id: true, lexorank: true },
    });

    const nextSection = await this.sectionRepository.findOne({
      where: {
        projectId: sectionToMove.projectId,
        lexorank: MoreThan(prevSection.lexorank),
      },
      select: { id: true, lexorank: true },
      order: { lexorank: 'ASC' },
    });

    const newLexorank = Lexorank.getMidpoint(
      prevSection.lexorank,
      nextSection?.lexorank || '',
    );

    await this.sectionRepository.update({ id }, { lexorank: newLexorank });
  }

  async deleteSection(id: string): Promise<boolean> {
    const result = await this.sectionRepository.delete({ id });
    return result.affected !== 0; // NOTE: more detail response
  }
}
