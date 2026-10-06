import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { randomUUID } from 'node:crypto';
import { Task } from '../entities/task.entity';
import { InjectRepository } from '@nestjs/typeorm';

import { CreateTaskDto, UpdateTaskDto } from '../dto/add-task.dto';
import { TaskFilterDto } from '../dto/get-my-tasks.dto';
import { Section } from '@/src/modules/sections/section.entity';
import { TaskPriority } from '@todo/shared';

interface RawTaskRow {
  id: string;
  title: string;
  description: string | null;
  priority: TaskPriority;
  section_id: string;
  lexorank: string;
  created_at: Date;
  updated_at: Date;
  completed_at: Date | null;
}

interface DatabaseError extends Error {
  code?: string;
}

function handleDatabaseOrderingError(error: unknown): never {
  const dbError = error as DatabaseError;
  if (dbError?.code === 'P0002') {
    throw new NotFoundException(dbError.message);
  }
  if (dbError?.code === '22000' || dbError?.code === 'P0001') {
    throw new BadRequestException(dbError.message);
  }
  throw error;
}

@Injectable()
export class TaskService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(Task) private readonly taskRepository: Repository<Task>,
    @InjectRepository(Section)
    private readonly sectionRepository: Repository<Section>,
  ) {}

  async createTask(
    ownerId: string,
    createTaskDto: CreateTaskDto,
  ): Promise<Task> {
    const taskId = randomUUID();
    const timeRangeStart = createTaskDto.timeRange?.start ?? null;
    const timeRangeEnd = createTaskDto.timeRange?.end ?? null;
    const labelIds = createTaskDto.labels?.length
      ? createTaskDto.labels.map((l) => l.id)
      : null;

    try {
      const [rawTask] = await this.dataSource.query<[RawTaskRow]>(
        `
          SELECT *
          FROM create_task(
            $1::uuid,
            $2::uuid,
            $3::uuid,
            $4::text,
            $5::text,
            $6::text,
            $7::timestamptz,
            $8::timestamptz,
            $9::uuid[]
          );
        `,
        [
          ownerId,
          taskId,
          createTaskDto.sectionId,
          createTaskDto.title,
          createTaskDto.description ?? null,
          createTaskDto.priority ?? 'high',
          timeRangeStart,
          timeRangeEnd,
          labelIds,
        ],
      );

      return {
        id: rawTask.id,
        title: rawTask.title,
        description: rawTask.description,
        priority: rawTask.priority,
        sectionId: rawTask.section_id,
        lexorank: rawTask.lexorank,
        createdAt: rawTask.created_at,
        updatedAt: rawTask.updated_at,
        completedAt: rawTask.completed_at,
        timeRange: createTaskDto.timeRange ?? null,
        labels: createTaskDto.labels ?? [],
        recurrence: null,
        occurences: [],
      } as unknown as Task;
    } catch (error: unknown) {
      handleDatabaseOrderingError(error);
    }
  }

  async getAllTasks(): Promise<Task[]> {
    return this.taskRepository.find();
  }

  async getTaskById(id: string): Promise<Task | null> {
    return this.taskRepository.findOne({ where: { id } });
  }

  async getTasksByOwnerIdProjectIdAndFilter(
    ownerId: string,
    projectId: string,
    filter: TaskFilterDto,
  ): Promise<Task[]> {
    // TODO: pagination
    return this.dataSource.transaction(async (transactionalEntityManager) => {
      await transactionalEntityManager.query(
        `SET LOCAL pg_trgm.similarity_threshold = 0.2;`,
      );

      const queryBuilder = transactionalEntityManager
        .createQueryBuilder(Task, 'task')
        .innerJoin('task.section', 'section')
        .innerJoin(
          'section.project',
          'project',
          'project.id = :projectId AND project.ownerId = :ownerId',
          { projectId, ownerId },
        )
        .leftJoin('task.recurrence', 'recurrence');

      if (filter.title) {
        queryBuilder.andWhere('task.title % :title', { title: filter.title });
        queryBuilder.orderBy('similarity(task.title, :title)', 'DESC');
      } else {
        queryBuilder.orderBy('task.lexorank', 'ASC');
      }

      if (filter.taskLabelIds && filter.taskLabelIds.length > 0) {
        queryBuilder.innerJoin(
          'task.labels',
          'label',
          'label.id IN (:...taskLabelIds)',
          { taskLabelIds: filter.taskLabelIds },
        );
      } else {
        queryBuilder.leftJoin('task.labels', 'label');
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
    });
  }

  // TODO: @Cleanup @Temporary
  async getTasksByOwnerIdAndFilter(
    ownerId: string,
    filter: TaskFilterDto,
  ): Promise<Task[]> {
    return this.dataSource.transaction(async (transactionalEntityManager) => {
      await transactionalEntityManager.query(
        `SET LOCAL pg_trgm.similarity_threshold = 0.2;`,
      );

      const queryBuilder = transactionalEntityManager
        .createQueryBuilder(Task, 'task')
        .innerJoin('task.section', 'section')
        .innerJoin('section.project', 'project')
        .andWhere('project.ownerId = :ownerId', { ownerId })
        .leftJoin('task.recurrence', 'recurrence');

      if (filter.title) {
        queryBuilder.andWhere('task.title % :title', { title: filter.title });
        queryBuilder.orderBy('similarity(task.title, :title)', 'DESC');
      } else {
        queryBuilder.orderBy('task.lexorank', 'ASC');
      }

      if (filter.taskLabelIds && filter.taskLabelIds.length > 0) {
        queryBuilder.innerJoin(
          'task.labels',
          'label',
          'label.id IN (:...taskLabelIds)',
          { taskLabelIds: filter.taskLabelIds },
        );
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
        'recurrence.id',
        'recurrence.rrule',
      ]);

      return queryBuilder.getMany();
    });
  }

  async getTasksByOwnerIdThatDueInTimeRange(
    ownerId: string,
    rangeStartISO8601: string,
    rangeEndISO8601: string,
  ): Promise<Task[]> {
    return this.taskRepository
      .createQueryBuilder('task')
      .innerJoin('task.section', 'section')
      .innerJoin('section.project', 'project', 'project.ownerId = :ownerId', {
        ownerId,
      })
      .leftJoin('task.labels', 'label')
      .leftJoin('task.recurrence', 'recurrence')
      .andWhere(
        'upper(task.timeRange) BETWEEN :rangeStart::timestamptz AND :rangeEnd::timestamptz',
        {
          rangeStart: rangeStartISO8601,
          rangeEnd: rangeEndISO8601,
        },
      )
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
    rangeEndISO8601: string,
  ): Promise<Task[]> {
    const result = await this.taskRepository
      .createQueryBuilder('task')
      .innerJoin('task.section', 'section')
      .innerJoin('section.project', 'project', 'project.ownerId = :ownerId', {
        ownerId,
      })
      .where('task.completedAt IS NOT NULL')
      .andWhere(
        'task.completedAt BETWEEN :rangeStart::timestamptz AND :rangeEnd::timestamptz',
        {
          rangeStart: rangeStartISO8601,
          rangeEnd: rangeEndISO8601,
        },
      )
      .select(['task', 'section.id', 'project.id', 'project.name'])
      .getMany();

    return result;
  }

  async updateTask(
    id: string,
    updatedTask: UpdateTaskDto,
  ): Promise<Task | null> {
    const task = await this.getTaskById(id);
    if (!task) {
      return null;
    }
    Object.assign(task, updatedTask);
    return this.taskRepository.save(task);
  }

  async updateTaskOrder({
    ownerId,
    taskId,
    sectionId,
    prevId,
  }: {
    ownerId: string;
    taskId: string;
    sectionId: string;
    prevId: string | null;
  }): Promise<void> {
    try {
      await this.dataSource.query(
        `
          SELECT move_task(
            $1::uuid,
            $2::uuid,
            $3::uuid,
            $4::uuid
          );
        `,
        [ownerId, taskId, sectionId, prevId ?? null],
      );
    } catch (error: unknown) {
      handleDatabaseOrderingError(error);
    }
  }

  async deleteTask(id: string): Promise<boolean> {
    const result = await this.taskRepository.delete(id);
    return result.affected !== 0;
  }
}
