import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { Project } from "./project.entity";



@Injectable()
export class ProjectService {
  constructor(
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>
  ) {}

  async createProject(ownerId: string, title: string, description?: string): Promise<Project> {
    const project = this.projectRepository.create({ ownerId, title, description });
    return this.projectRepository.save(project);
  }

  async getAllProjects(): Promise<Project[]> {
    return this.projectRepository.find();
  }

  async getProjectsByOwnerId(ownerId: string): Promise<Project[]> { // TODO: pagination
    return this.projectRepository.find({ where: { ownerId } });
  }

  async getProjectsByOwnerIdAndTitle(ownerId: string, title: string): Promise<Project[]> { // TODO: pagination
    return this.projectRepository.manager.transaction(async (transactionalEntityManager) => {
      await transactionalEntityManager.query(`SET LOCAL pg_trgm.similarity_threshold = 0.2;`); // Set a lower threshold for similarity
      return transactionalEntityManager
        .createQueryBuilder(Project, "project")
        .where("project.ownerId = :ownerId", { ownerId })
        .andWhere("project.title % :title", { title }) // Using the % operator for full-text search
        .orderBy("similarity(project.title, :title)", "DESC")
        .setParameters({ ownerId, title })
        .getMany();
    });
  }

  async getProjectById(id: string): Promise<Project | null> {
    return this.projectRepository.findOne({ where: { id } });
  }


  async updateProject(id: string, updatedProject: Partial<Project>): Promise<Project | null> {
    const project = await this.getProjectById(id);
    if (!project) {
      return null;
    }
    Object.assign(project, updatedProject);
    return this.projectRepository.save(project);
  }

  async deleteProject(id: string): Promise<boolean> {
    const result = await this.projectRepository.delete({
      id,
      isDefault: false, // Prevent deletion of default projects
    });
    return result.affected !== 0; // NOTE: more detail response
  }
}