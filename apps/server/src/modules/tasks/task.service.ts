import { Injectable } from "@nestjs/common";
import { FindOptionsOrderValue, MoreThan, Raw, Repository } from "typeorm";
import { Task } from "./task.entity";
import { InjectRepository } from "@nestjs/typeorm";

import { CreateTaskDto } from "./dto/add-task.dto";
import { GetMyTasksFilterDto } from "./dto/get-my-tasks.dto";
import { Lexorank } from "../../common/utils/lexorank.util";

// TODO: @Cleanup
@Injectable()
export class TaskService {
  constructor(
    @InjectRepository(Task)
    private readonly taskRepository: Repository<Task>
  ) { }

  async createTask(ownerId: string, createTaskDto: CreateTaskDto): Promise<Task> {
    const taskHasHighestLexorank = await this.taskRepository.findOne({
      where: { ownerId },
      select: { lexorank: true },
      order: { lexorank: 'DESC' },
    });

    const highestLexorank = taskHasHighestLexorank?.lexorank || '';
    const newRank = Lexorank.getMidpoint(highestLexorank, ''); // passing '' means no upper limit

    const newTask = this.taskRepository.create({ ownerId, ...createTaskDto, lexorank: newRank });
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
        ...filter
      },
      order: { lexorank: 'ASC' },
    });
  }

  // async getTasksByOwnerIdAndFilter_New(ownerId: string, filter?: GetMyTasksFilterDto): Promise<Task[]> { // TODO: pagination
  //   if (filter?.title) 
  //   return this.taskRepository.manager.transaction(async (transactionalEntityManager) => {
  //     await transactionalEntityManager.query(`SET LOCAL pg_trgm.similarity_threshold = 0.2;`);

  //     return transactionalEntityManager.find(Task, {
  //       where: {
  //         ownerId,
  //         ...filter,
  //         title: Raw((alias) => `${alias} % :title`, { title: filter.title }),
  //       },
  //       order: {
  //         title: Raw((alias) => `similarity(${alias}, :title)`, { title: filter.title }) as FindOptionsOrderValue,
  //       }
  //     });
  //   })

  //   return this.taskRepository.find({
  //     where: {
  //       ownerId,
  //       ...filter,
  //     }
  //   });
  // }

  // TODO: @Temporary @Cleanup
  async getTasksByOwnerIdAndLabelId(ownerId: string, labelId: string): Promise<Task[]> {
    return this.taskRepository.find({
      where: {
        ownerId,
        labels: { id: labelId },
      },
      relations: {
        labels: true,
      }
    });
  }

  async getTasksByOwnerIdAndProjectIdWithSectionIdAndName(ownerId: string, projectId: string): Promise<Task[]> {
    return this.taskRepository.find({
      where: {
        ownerId,
        projectId,
      },
      select: {
        id: true,
        title: true,
        section: {
          id: true,
          name: true,
        }
      },
      relations: {
        section: true,
      },
      order: {
        lexorank: 'ASC',
      }
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

  async updateTaskOrder_New(ownerId: string, taskId: string, sectionId: string, prevId: string | null): Promise<void> {
    // TODO: check task if exist
    const taskToMove = await this.taskRepository.findOne({
      where: { id: taskId, ownerId },
      select: { id: true },
    });

    if (!taskToMove) {
      throw new Error("Task not found or does not belong to the owner.");
      // TODO: handle error more robustly. @Robustness
    }

    if (!prevId) {
      // If prevId is null, it means the task is being moved to the top of the list.
      // So we need to find the first task in the section to get its lexorank.
      const firstTaskInSection = await this.taskRepository.findOne({
        where: { sectionId, ownerId }, // FIX: This is not correct, as it can move from other section to this section. The "section" here mean "targetSection"
        select: { lexorank: true },
        order: { lexorank: 'ASC' },
      });

      await this.taskRepository.update(
        { id: taskId }, // TODO: check if task is correctly in the project. (and may need to check user also?)
        {
          lexorank: Lexorank.getMidpoint('', firstTaskInSection?.lexorank || ''),
          ...(sectionId !== undefined ? { sectionId } : {}), // Only update sectionId if it's provided @Cleanup
        }
      );
      return;
    }


    // NOTE: Is there any way to merge these two queries into one?
    const prevTask = await this.taskRepository.findOne({
      where: { id: prevId, sectionId },
      select: { lexorank: true },
    });
    // NOTE: if prevTask is empty, it means something is very wrong. // TODO: @Robustness
    if (!prevTask) return;

    const nextTask = await this.taskRepository.findOne({
      where: { sectionId, lexorank: MoreThan(prevTask.lexorank) },
      select: { lexorank: true },
      order: { lexorank: 'ASC' },
    });


    taskToMove.lexorank = Lexorank.getMidpoint(prevTask.lexorank, nextTask?.lexorank || '');

    await this.taskRepository.update(
      { id: taskToMove.id, ownerId },
      {
        lexorank: taskToMove.lexorank,
        ...(sectionId !== undefined ? { sectionId } : {}), // Only update sectionId if it's provided @Cleanup
      }
    )
  }




  // NOTE: This version is not robust.
  async updateTaskOrder(ownerId: string, taskId: string, sectionId?: string, prevId?: string, nextId?: string): Promise<void> {
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
      {
        lexorank: taskToMove.lexorank,
        ...(sectionId !== undefined ? { sectionId } : {}), // Only update sectionId if it's provided @Cleanup
      }
    )
  }

  async deleteTask(id: string): Promise<boolean> {
    const result = await this.taskRepository.delete(id);
    return result.affected !== 0;
  }
}