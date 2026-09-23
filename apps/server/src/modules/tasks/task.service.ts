import { Injectable } from "@nestjs/common";
import { Between, EntityNotFoundError, FindOptionsOrderValue, LessThan, MoreThan, Raw, Repository } from "typeorm";
import { Task } from "./task.entity";
import { InjectRepository } from "@nestjs/typeorm";

import { CreateTaskDto, UpdateTaskDto } from "./dto/add-task.dto";
import { Dto_Filter_GetTasks } from "./dto/get-my-tasks.dto";
import { Lexorank } from "../../common/utils/lexorank.util";
import { Section } from "../sections/section.entity";
import { DataSource } from "typeorm";

// TODO: @Cleanup
@Injectable()
export class TaskService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(Task) private readonly taskRepository: Repository<Task>,
    @InjectRepository(Section) private readonly sectionRepository: Repository<Section>
  ) { }

  async createTask(ownerId: string, createTaskDto: CreateTaskDto): Promise<Task> {
    // NOTE: This may introduce a race condition.
    const taskHasHighestLexorank = await this.taskRepository.findOne({
      where: { sectionId: createTaskDto.sectionId },
      select: { lexorank: true },
      order: { lexorank: 'DESC' },
    });

    const highestLexorank = taskHasHighestLexorank?.lexorank || '';
    const newRank = Lexorank.getMidpoint(highestLexorank, ''); // passing '' means no upper limit

    const newTask = this.taskRepository.create({ ...createTaskDto, lexorank: newRank });
    return this.taskRepository.save(newTask);
  }

  async getAllTasks(): Promise<Task[]> {
    return this.taskRepository.find();
  }

  async getTaskById(id: string): Promise<Task | null> {
    return this.taskRepository.findOne({ where: { id } });
  }

  // NOTE: may distinguish between getting tasks and getting tasks with title.
  async getTasksByOwnerIdProjectIdAndFilter(ownerId: string, projectId: string, filter?: Dto_Filter_GetTasks): Promise<Task[]> { // TODO: pagination
    if (filter?.title) 
    return this.dataSource.transaction(async (transactionalEntityManager) => {
      await transactionalEntityManager.query(`SET LOCAL pg_trgm.similarity_threshold = 0.2;`);

      return transactionalEntityManager.find(Task, {
        where: {
          section: { project: { id: projectId, ownerId } },
          ...filter,
          title: Raw((alias) => `${alias} % :title`, { title: filter.title }),
        },
        order: {
          title: Raw((alias) => `similarity(${alias}, :title)`, { title: filter.title }) as FindOptionsOrderValue,
          lexorank: 'ASC',
        }
      });
    })

    return this.taskRepository.find({
      where: {
        section: { project: { id: projectId, ownerId } },
        ...filter,
      },
      order: {
        lexorank: 'ASC',
      }
    });
  }
  // TODO: @Cleanup @Temporary
  // NOTE: may distinguish between getting tasks and getting tasks with title.
  async getTasksByOwnerId(ownerId: string, filter?: Dto_Filter_GetTasks): Promise<Task[]> {
    if (filter?.title) 
    return this.dataSource.transaction(async (transactionalEntityManager) => {
      await transactionalEntityManager.query(`SET LOCAL pg_trgm.similarity_threshold = 0.2;`);

      return transactionalEntityManager.find(Task, {
        where: {
          section: { project: { ownerId } },
          ...filter,
          title: Raw((alias) => `${alias} % :title`, { title: filter.title }),
        },
        order: {
          title: Raw((alias) => `similarity(${alias}, :title)`, { title: filter.title }) as FindOptionsOrderValue,
          lexorank: 'ASC',
        }
      });
    })

    return this.taskRepository.find({
      where: {
        section: { project: { ownerId } },
        ...filter,
      },
      order: {
        lexorank: 'ASC',
      }
    });
  }

  // TODO: @Temporary @Cleanup
  async getTasksByOwnerIdAndLabelId(ownerId: string, labelId: string): Promise<Task[]> {
    return this.taskRepository.find({
      where: {
        section: { project: { ownerId } },
        labels: { id: labelId },
      },
    });
  }

  async getTasksByOwnerIdAndProjectIdWithSectionIdAndName({
    ownerId, projectId,
  }: {
    ownerId: string;
    projectId: string;
  }): Promise<Task[]> {
    return this.taskRepository.find({
      where: { section: { project: { id: projectId, ownerId } } },
      select: {
        id: true,
        title: true,
        section: {
          id: true,
          name: true,
        }
      },
      order: {
        lexorank: 'ASC',
      }
    });
  }

  async getTasksByOwnerIdThatDueInTimeRange(ownerId: string, startDate: Date, endDate: Date): Promise<Task[]> {
    return this.taskRepository.find({
      where: {
        section: { project: { ownerId } },
        dueAt: Between(startDate, endDate), // NOTE: inclusive.
      },
    });
  }


  async updateTask(id: string, updatedTask: UpdateTaskDto): Promise<Task | null> {
    const task = await this.getTaskById(id);
    if (!task) {
      return null;
    }
    Object.assign(task, updatedTask);
    return this.taskRepository.save(task);
  }

  // NOTE: too much failure points.
  async updateTaskOrder_New({
    ownerId, taskId, sectionId, prevId
  }: {
    ownerId: string;
    taskId: string;
    sectionId: string;
    prevId: string | null
  }): Promise<void> {
    const taskDoesExist = await this.taskRepository.exists({
      where: { id: taskId, section: { project: { ownerId } } },
    });
    if (!taskDoesExist) {
      throw new EntityNotFoundError(Task, `Task with ID ${taskId} does not exist or does not belong to the user.`);
    }

    const sectionDoesBelongToUser = await this.sectionRepository.exists({
      where: { id: sectionId, project: { ownerId } },
    });

    if (!sectionDoesBelongToUser) {
      throw new EntityNotFoundError(Section, `Section with ID ${sectionId} does not exist or does not belong to the user.`);
    }

    if (!prevId) {
      // If prevId is null, it means the task is being moved to the top of the list.
      // So we need to find the first task in the section to get its lexorank.
      const firstTaskInSection = await this.taskRepository.findOne({
        where: { sectionId },
        select: { lexorank: true },
        order: { lexorank: 'ASC' },
      });

      await this.taskRepository.update(
        { id: taskId },
        {
          lexorank: Lexorank.getMidpoint('', firstTaskInSection?.lexorank || ''),
          sectionId: sectionId,
        }
      );
      return;
    }


    // If prevId is provided, it must be a valid task.
    const prevTask = await this.taskRepository.findOneOrFail({
      where: { id: prevId, sectionId },
      select: { lexorank: true },
    });

    const nextTask = await this.taskRepository.findOne({
      where: { sectionId, lexorank: MoreThan(prevTask.lexorank) },
      select: { lexorank: true },
      order: { lexorank: 'ASC' },
    });


    const newLexorank = Lexorank.getMidpoint(prevTask.lexorank, nextTask?.lexorank || '');

    await this.taskRepository.update(
      { id: taskId },
      {
        lexorank: newLexorank,
        sectionId: sectionId,
      }
    )
  }


  async deleteTask(id: string): Promise<boolean> {
    const result = await this.taskRepository.delete(id);
    return result.affected !== 0;
  }
}