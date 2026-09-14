import { Injectable } from "@nestjs/common";
import { Repository } from "typeorm";
import { Task } from "./task.entity";
import { InjectRepository } from "@nestjs/typeorm";

import { type AddTaskDto } from "./dto/add-task.dto";
import { GetMyTasksFilterDto } from "./dto/get-my-tasks.dto";

@Injectable()
export class TaskService {
  constructor(
    @InjectRepository(Task)
    private readonly taskRepository: Repository<Task>
  ) {}

  async createTask(ownerId: string, addTaskDto: AddTaskDto ): Promise<Task> {
    const task = this.taskRepository.create({ ownerId, ...addTaskDto });
    return this.taskRepository.save(task);
  }

  async getAllTasks(): Promise<Task[]> {
    return this.taskRepository.find();
  }

  async getTaskById(id: number): Promise<Task | null> {
    return this.taskRepository.findOne({ where: { id } });
  }

  async getTasksByOwnerId(ownerId: string): Promise<Task[]> {
    return this.taskRepository.find({ where: { ownerId } });
  }

  async getTasksByOwnerIdAndTitle(ownerId: string, title: string): Promise<Task[]> {
    return this.taskRepository.manager.transaction(async (transactionalEntityManager) => {
      await transactionalEntityManager.query(`SET LOCAL pg_trgm.similarity_threshold = 0.2;`); // Set a lower threshold for similarity
      return transactionalEntityManager
        .createQueryBuilder(Task, "task")
        .where("task.ownerId = :ownerId", { ownerId })
        .andWhere("task.title % :title", { title }) // Using the % operator for full-text search
        .orderBy("similarity(task.title, :title)", "DESC")
        .setParameters({ ownerId, title })
        .getMany();
    });
  }

  async getTasksByOwnerIdAndFilter(ownerId: string, filter: GetMyTasksFilterDto): Promise<Task[]> {
    return this.taskRepository.find({
      where: {
        ownerId,
        // ...(filter.title && { title: filter.title }),
        // ...(filter.status && { completedAt: filter.status === "completed" ? Not(IsNull()) : IsNull() }),
        // ...(filter.projectId && { projectId: filter.projectId }),
        ...filter
      }
    });
  }

  async updateTask(id: number, updatedTask: Partial<Task>): Promise<Task | null> {
    const task = await this.getTaskById(id);
    if (!task) {
      return null;
    }
    Object.assign(task, updatedTask);
    return this.taskRepository.save(task);
  }

  async deleteTask(id: number): Promise<boolean> {
    const result = await this.taskRepository.delete(id);
    return result.affected !== 0;
  }
}