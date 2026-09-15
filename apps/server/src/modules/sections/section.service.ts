import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { Section } from "./section.entity";
import { Project } from "../projects/project.entity";



@Injectable()
export class SectionService {
  constructor(
    @InjectRepository(Section)
    private readonly sectionRepository: Repository<Section>
  ) {}

  // TODO: implement DTO
  async createSection(
    ownerId: string,
    projectId: string,
    title: string,
    description?: string
  ): Promise<Section> {
    const exists = await this.sectionRepository.manager.exists(Project, { where: { id: projectId, ownerId } });

    if (!exists) {
      throw new Error("Project not found or you do not have permission to add a section to this project.");
    }

    const section = this.sectionRepository.create({ projectId, title, description });
    return this.sectionRepository.save(section);
  }

  async getAllSections(): Promise<Section[]> {
    return this.sectionRepository.find();
  }

  async getSectionsByProjectId(projectId: string): Promise<Section[]> { // TODO: pagination
    return this.sectionRepository.find({ where: { projectId } });
  }

  async getSectionsByProjectIdAndTitle(projectId: string, title: string): Promise<Section[]> { // TODO: pagination
    return this.sectionRepository.manager.transaction(async (transactionalEntityManager) => {
      await transactionalEntityManager.query(`SET LOCAL pg_trgm.similarity_threshold = 0.2;`); // Set a lower threshold for similarity
      return transactionalEntityManager
        .createQueryBuilder(Section, "section")
        .where("section.projectId = :projectId", { projectId })
        .andWhere("section.title % :title", { title }) // Using the % operator for full-text search
        .orderBy("similarity(section.title, :title)", "DESC")
        .setParameters({ projectId, title })
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

  async deleteSection(id: string): Promise<boolean> {
    const result = await this.sectionRepository.delete({ id });
    return result.affected !== 0; // NOTE: more detail response
  }
}