import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Raw, Repository, type FindOptionsOrderValue } from "typeorm";

import { Project } from "./project.entity";
import { CreateProjectDto } from "./dto/create-project.dto";



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

  async getAllProjects(): Promise<Project[]> {
    return this.projectRepository.find();
  }

  async getProjectsByOwnerIdAndFilter(ownerId: string, filter?: {
    name?: string;
    isDefault?: boolean; // TODO: type of filter
  }): Promise<Project[]> { // TODO: pagination

    if (filter?.name) 
    return this.projectRepository.manager.transaction(async (transactionalEntityManager) => {
      await transactionalEntityManager.query(`SET LOCAL pg_trgm.similarity_threshold = 0.2;`);

      return transactionalEntityManager.find(Project, {
        where: {
          ownerId,
          ...filter,
          name: Raw((alias) => `${alias} % :name`, { name: filter.name }),
        },
        order: {
          name: Raw((alias) => `similarity(${alias}, :name)`, { name: filter.name }) as FindOptionsOrderValue,
        }
      });
    })

    return this.projectRepository.find({
      where: {
        ownerId,
        ...filter,
      }
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