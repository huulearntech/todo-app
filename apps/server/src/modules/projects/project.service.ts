import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { Project } from "./project.entity";
import { CreateProjectDto } from "./dto/create-project.dto";
import { User } from "../users/user.entity";



@Injectable()
export class ProjectService {
  constructor(
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>
  ) {}

  async createProject(ownerId: string, createProjectDto: CreateProjectDto): Promise<Project> {
    const { name, description } = createProjectDto; // NOTE: avoid any changes afterwards from breaking this
    const project = this.projectRepository.create({ ownerId, name, description });
    return this.projectRepository.save(project);
  }

  async getProjectsByOwnerIdAndFilter(ownerId: string, filter: {
    name?: string;
    isDefault?: boolean; // TODO: type of filter
  } = {}): Promise<Project[]> { // TODO: pagination

    return this.projectRepository.manager.transaction(async (transactionalEntityManager) => {
      await transactionalEntityManager.query('SET LOCAL pg_trgm.similarity_threshold = 0.2;');

      const queryBuilder = transactionalEntityManager
        .createQueryBuilder(Project, "project")
        .where("project.ownerId = :ownerId", { ownerId })

      if (filter.isDefault !== undefined) {
        queryBuilder.innerJoin(User, "user", "user.id = project.ownerId")
        if (filter.isDefault) {
          queryBuilder.andWhere("project.id = user.defaultProjectId")
        } else {
          queryBuilder.andWhere("project.id != user.defaultProjectId")
        }
      }

      if (filter.name) {
        queryBuilder.andWhere("project.name % :name", { name: filter.name })
        queryBuilder.orderBy("similarity(project.name, :name)", "DESC")
      } else {
        queryBuilder.orderBy("project.createdAt", "DESC")
      }

      return queryBuilder.getMany();
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
    const result = await this.projectRepository.delete({ id });
    return result.affected !== 0;
  }
}