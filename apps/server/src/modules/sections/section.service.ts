import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { MoreThan, Repository } from "typeorm";

import { Section } from "./section.entity";
import { Project } from "../projects/project.entity";
import { type CreateSectionDto } from "./dto/create-section.dto";
import { Lexorank } from "../../common/utils/lexorank.util";



@Injectable()
export class SectionService {
  constructor(
    @InjectRepository(Section)
    private readonly sectionRepository: Repository<Section>
  ) {}

  async createSection(ownerId: string, createSectionDto: CreateSectionDto): Promise<Section> {
    const { projectId, name, description } = createSectionDto;
    const exists = await this.sectionRepository.manager.exists(Project, { where: { id: projectId, ownerId } });

    if (!exists) {
      throw new Error("Project not found or you do not have permission to add a section to this project.");
    }

    const sectionWithHighestLexorank = await this.sectionRepository.findOne({
      where: { projectId },
      select: { lexorank: true },
      order: { lexorank: 'DESC' },
    });

    const highestLexorank = sectionWithHighestLexorank?.lexorank || '';
    const newRank = Lexorank.getMidpoint(highestLexorank, ''); // passing '' means no upper limit

    const section = this.sectionRepository.create({ projectId, name, description, lexorank: newRank });
    return this.sectionRepository.save(section);
  }

  async getAllSections(): Promise<Section[]> {
    return this.sectionRepository.find();
  }

  async getSectionsByProjectId(projectId: string): Promise<Section[]> { // TODO: pagination
    return this.sectionRepository.find({ where: { projectId } });
  }

  async getSectionsIdAndNameByProjectId(projectId: string): Promise<Section[]> { // TODO: pagination
    return this.sectionRepository.find({
      where: { projectId },
      select: { id: true, name: true },
      order: { lexorank: 'ASC' },
    });
  }

  async getSectionsByProjectIdAndName(projectId: string, name: string): Promise<Section[]> { // TODO: pagination
    return this.sectionRepository.manager.transaction(async (transactionalEntityManager) => {
      await transactionalEntityManager.query(`SET LOCAL pg_trgm.similarity_threshold = 0.2;`); // Set a lower threshold for similarity
      return transactionalEntityManager
        .createQueryBuilder(Section, "section")
        .where("section.projectId = :projectId", { projectId })
        .andWhere("section.name % :name", { name }) // Using the % operator for full-text search
        .orderBy("similarity(section.name, :name)", "DESC")
        .setParameters({ projectId, name })
        .getMany();
    });
  }

  async getSectionById(id: string): Promise<Section | null> {
    return this.sectionRepository.findOne({ where: { id } });
  }


  async updateSection(id: string, updatedSection: Partial<Section>): Promise<Section | null> {
    const section = await this.getSectionById(id);
    if (!section) {
      return null;
    }
    Object.assign(section, updatedSection);
    return this.sectionRepository.save(section);
  }

  // NOTE: how can you know if it is the owner request this or not?
  async updateSectionOrder({
    sectionId, prevId
  }: {
    sectionId: string;
    prevId: string | null
  }): Promise<void> {
    const sectionToMove = await this.sectionRepository.findOne({
      where: { id: sectionId },
      select: { lexorank: true, projectId: true },
    });

    if (!sectionToMove) {
      throw new Error("Section not found or does not belong to the project.");
      // TODO: handle error more robustly. @Robustness
    }
    if (!prevId) {

      // If prevId is null, it means the task is being moved to the top of the list.
      // So we need to find the first task in the section to get its lexorank.
      const firstSectionInProject = await this.sectionRepository.findOne({
        where: { projectId: sectionToMove.projectId },
        select: { lexorank: true },
        order: { lexorank: 'ASC' },
      });

      await this.sectionRepository.update(
        { id: sectionId },
        { lexorank: Lexorank.getMidpoint('', firstSectionInProject?.lexorank || '') }
      );
      return;
    }

    const prevSection = await this.sectionRepository.findOne({
      where: { id: prevId, projectId: sectionToMove.projectId },
      select: { lexorank: true },
    });
    
    if (!prevSection) {
      throw new Error("Previous section not found or does not belong to the project.");
    }

    const nextSection = await this.sectionRepository.findOne({
      where: { projectId: sectionToMove.projectId, lexorank: MoreThan(prevSection.lexorank) },
      select: { lexorank: true },
      order: { lexorank: 'ASC' },
    });

    const newLexorank = Lexorank.getMidpoint(prevSection.lexorank, nextSection?.lexorank || '');

    await this.sectionRepository.update(
      { id: sectionToMove.id },
      { lexorank: newLexorank }
    )
  }


  async deleteSection(id: string): Promise<boolean> {
    const result = await this.sectionRepository.delete({ id });
    return result.affected !== 0; // NOTE: more detail response
  }
}