import { Injectable } from "@nestjs/common";
import { Repository } from "typeorm";
import { Task } from "./task.entity";
import { InjectRepository } from "@nestjs/typeorm";

import { type AddTaskDto } from "./dto/add-task.dto";
import { GetMyTasksFilterDto } from "./dto/get-my-tasks.dto";
import { Lexorank } from "../../common/utils/lexorank.util";

@Injectable()
export class TaskService {
  constructor(
    @InjectRepository(Task)
    private readonly taskRepository: Repository<Task>
  ) {}

  async createTask(ownerId: string, addTaskDto: AddTaskDto ): Promise<Task> {
    const lastTask = await this.taskRepository.findOne({
      where: { ownerId },
      select: { lexorank: true },
      order: { lexorank: 'DESC' },
    });

    const prevRank = lastTask ? lastTask.lexorank : '';
    const newRank = Lexorank.getMidpoint(prevRank, ''); // passing '' means no upper limit

    const newTask = this.taskRepository.create({ ownerId, ...addTaskDto, lexorank: newRank });
    return this.taskRepository.save(newTask);
  }

  async getAllTasks(): Promise<Task[]> {
    return this.taskRepository.find();
  }

  async getTaskById(id: string): Promise<Task | null> {
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
      },
      order: { lexorank: 'ASC' },
    });
  }

  async updateTask(id: string, updatedTask: Partial<Task>): Promise<Task | null> {
    const task = await this.getTaskById(id);
    if (!task) {
      return null;
    }
    Object.assign(task, updatedTask);
    return this.taskRepository.save(task);
  }

  async updateTaskOrder(ownerId: string, taskId: string, prevId?: string, nextId?: string): Promise<void> {
    const taskToMove = await this.taskRepository.findOne({
      where: { id: taskId, ownerId },
      select: { id: true, lexorank: true },
    });

    if (!taskToMove) {
      throw new Error("Task not found or does not belong to the owner.");
      // TODO: handle error more robustly. @Robustness
    }

    let prevRank = '';
    let nextRank = '';

    if (prevId) {
      const prevTask = await this.taskRepository.findOne({
        where: { id: prevId, ownerId },
        select: { lexorank: true },
      });
      if (prevTask) prevRank = prevTask.lexorank;
    }

    if (nextId) {
      const nextTask = await this.taskRepository.findOne({
        where: { id: nextId, ownerId },
        select: { lexorank: true },
      });
      if (nextTask) nextRank = nextTask.lexorank;
    }
    
    taskToMove.lexorank = Lexorank.getMidpoint(prevRank, nextRank);

    // return this.taskRepository.save(taskToMove);
    await this.taskRepository.update(
      { id: taskToMove.id, ownerId },
      { lexorank: taskToMove.lexorank }
    )
  }

  async deleteTask(id: string): Promise<boolean> {
    const result = await this.taskRepository.delete(id);
    return result.affected !== 0;
  }
}