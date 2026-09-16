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

  async createProject(ownerId: string, name: string, description?: string): Promise<Project> {
    const project = this.projectRepository.create({ ownerId, name, description });
    return this.projectRepository.save(project);
  }

  async getAllProjects(): Promise<Project[]> {
    return this.projectRepository.find();
  }

  async getProjectsByOwnerId(ownerId: string): Promise<Project[]> { // TODO: pagination
    return this.projectRepository.find({ where: { ownerId } });
  }

  async getProjectsByOwnerIdAndName(ownerId: string, name: string): Promise<Project[]> { // TODO: pagination
    return this.projectRepository.manager.transaction(async (transactionalEntityManager) => {
      await transactionalEntityManager.query(`SET LOCAL pg_trgm.similarity_threshold = 0.2;`); // Set a lower threshold for similarity
      return transactionalEntityManager
        .createQueryBuilder(Project, "project")
        .where("project.ownerId = :ownerId", { ownerId })
        .andWhere("project.name % :name", { name }) // Using the % operator for full-text search
        .orderBy("similarity(project.name, :name)", "DESC")
        .setParameters({ ownerId, name })
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