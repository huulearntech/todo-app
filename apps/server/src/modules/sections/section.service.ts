import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

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
  async updateSectionOrder(projectId: string, sectionId: string, prevId?: string, nextId?: string): Promise<void> {
    const sectionToMove = await this.sectionRepository.findOne({
      where: { id: sectionId, projectId },
      select: { id: true, lexorank: true },
    });

    if (!sectionToMove) {
      throw new Error("Section not found or does not belong to the project.");
      // TODO: handle error more robustly. @Robustness
    }

    let prevRank = '';
    let nextRank = '';

    if (prevId) {
      const prevTask = await this.sectionRepository.findOne({
        where: { id: prevId, projectId },
        select: { lexorank: true },
      });
      if (prevTask) prevRank = prevTask.lexorank;
    }

    if (nextId) {
      const nextTask = await this.sectionRepository.findOne({
        where: { id: nextId, projectId },
        select: { lexorank: true },
      });
      if (nextTask) nextRank = nextTask.lexorank;
    }
    
    sectionToMove.lexorank = Lexorank.getMidpoint(prevRank, nextRank);

    // return this.taskRepository.save(taskToMove);
    await this.sectionRepository.update(
      { id: sectionToMove.id, projectId },
      { lexorank: sectionToMove.lexorank }
    )
  }


  async deleteSection(id: string): Promise<boolean> {
    const result = await this.sectionRepository.delete({ id });
    return result.affected !== 0; // NOTE: more detail response
  }
}