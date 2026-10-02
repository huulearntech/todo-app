import { Injectable } from "@nestjs/common";
import { Between, EntityNotFoundError, MoreThan, Repository } from "typeorm";
import { Task } from "../entities/task.entity";
import { InjectRepository } from "@nestjs/typeorm";

import { CreateTaskDto, UpdateTaskDto } from "../dto/add-task.dto";
import { TaskFilterDto } from "../dto/get-my-tasks.dto";
import { Lexorank } from "@/src/common/utils/lexorank.util";
import { Section } from "@/src/modules/sections/section.entity";
import { DataSource } from "typeorm";


@Injectable()
export class TaskService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(Task) private readonly taskRepository: Repository<Task>,
    @InjectRepository(Section) private readonly sectionRepository: Repository<Section>
  ) { }

  async createTask(createTaskDto: CreateTaskDto): Promise<Task> {
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

  async getTasksByOwnerIdProjectIdAndFilter(ownerId: string, projectId: string, filter: TaskFilterDto): Promise<Task[]> { // TODO: pagination
    return this.dataSource.transaction(async (transactionalEntityManager) => {
      await transactionalEntityManager.query(`SET LOCAL pg_trgm.similarity_threshold = 0.2;`);

      const queryBuilder = transactionalEntityManager
        .createQueryBuilder(Task, 'task')
        .innerJoin('task.section', 'section')
        .innerJoin(
          'section.project',
          'project',
          'project.id = :projectId AND project.ownerId = :ownerId',
          { projectId, ownerId }
        )
        .leftJoin('task.recurrence', 'recurrence')

      if (filter.title) {
        queryBuilder.andWhere('task.title % :title', { title: filter.title })
        queryBuilder.orderBy('similarity(task.title, :title)', 'DESC')
      } else {
        queryBuilder.orderBy('task.lexorank', 'ASC')
      }

      if (filter.taskLabelIds && filter.taskLabelIds.length > 0) {
        queryBuilder.innerJoin(
          'task.labels',
          'label',
          'label.id IN (:...taskLabelIds)',
          { taskLabelIds: filter.taskLabelIds }
        );
      } else {
        queryBuilder.leftJoin('task.labels', 'label')
      }

      // NOTE: If there is some way to keep this and the zod schema in sync, that would be great. But for now, this is just manual.
      queryBuilder.select([
        'task',
        'section.id',
        'section.name',
        'project.name',
        'label.id',
        'recurrence.id',
        'recurrence.rrule',
      ]);

      return queryBuilder.getMany();
    })
  }

  // TODO: @Cleanup @Temporary
  async getTasksByOwnerIdAndFilter(ownerId: string, filter: TaskFilterDto): Promise<Task[]> {
    return this.dataSource.transaction(async (transactionalEntityManager) => {
      await transactionalEntityManager.query(`SET LOCAL pg_trgm.similarity_threshold = 0.2;`);

      const queryBuilder = transactionalEntityManager
        .createQueryBuilder(Task, 'task')
        .innerJoin('task.section', 'section')
        .innerJoin('section.project', 'project')
        .andWhere('project.ownerId = :ownerId', { ownerId })

      if (filter.title) {
        queryBuilder.andWhere('task.title % :title', { title: filter.title })
        queryBuilder.orderBy('similarity(task.title, :title)', 'DESC')
      } else {
        queryBuilder.orderBy('task.lexorank', 'ASC')
      }

      if (filter.taskLabelIds && filter.taskLabelIds.length > 0) {
        queryBuilder.innerJoin('task.labels', 'label', 'label.id IN (:...taskLabelIds)', { taskLabelIds: filter.taskLabelIds });
      } else {
        queryBuilder.leftJoin('task.labels', 'label');
      }

      queryBuilder.select([
        'task',
        'section.id',
        'section.name',
        'project.name',
        'label.id',
        'label.name',
      ]);

      return queryBuilder.getMany();
    })
  }


  async getTasksByOwnerIdThatDueInTimeRange(
    ownerId: string,
    rangeStartISO8601: string,
    rangeEndISO8601: string
  ): Promise<Task[]> {
    return this.taskRepository.createQueryBuilder('task')
      .innerJoin('task.section', 'section')
      .innerJoin('section.project', 'project', 'project.ownerId = :ownerId', { ownerId })
      .leftJoin('task.labels', 'label')
      .leftJoin('task.recurrence', 'recurrence')
      .andWhere('upper(task.timeRange) BETWEEN :rangeStart::timestamptz AND :rangeEnd::timestamptz', {
        rangeStart: rangeStartISO8601,
        rangeEnd: rangeEndISO8601,
      })
      .select([
        'task',
        'section.id',
        'section.name',
        'project.name',
        'label.id',
        'label.name',
        'recurrence.id',
        'recurrence.rrule',
      ])
      .orderBy('task.lexorank', 'ASC')
      .getMany();
  }


  async getTasksByOwnerIdThatCompletedInTimeRange(
    ownerId: string,
    rangeStartISO8601: string,
    rangeEndISO8601: string
  ): Promise<Task[]> {
    const result = await this.taskRepository.createQueryBuilder('task')
      .innerJoin('task.section', 'section')
      .innerJoin('section.project', 'project', 'project.ownerId = :ownerId', { ownerId })
      .where('task.completedAt IS NOT NULL')
      .andWhere('task.completedAt BETWEEN :rangeStart::timestamptz AND :rangeEnd::timestamptz', {
        rangeStart: rangeStartISO8601,
        rangeEnd: rangeEndISO8601,
      })
      .select([
        'task',
        'section.id',
        'project.id',
        'project.name',
      ])
      .getMany();

    return result;
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
  async updateTaskOrder({
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
        select: { id: true, lexorank: true },
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
      select: { id: true, lexorank: true },
    });

    const nextTask = await this.taskRepository.findOne({
      where: { sectionId, lexorank: MoreThan(prevTask.lexorank) },
      select: { id: true, lexorank: true },
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