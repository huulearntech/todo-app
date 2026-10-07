import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { randomUUID } from 'node:crypto';
import { Task } from '../entities/task.entity';
import { TaskOccurrence } from '../entities/task-occurrence.entity';
import { InjectRepository } from '@nestjs/typeorm';

import { CreateTaskDto, UpdateTaskDto } from '../dto/add-task.dto';
import { TaskFilterDto } from '../dto/get-my-tasks.dto';
import { Section } from '@/src/modules/sections/section.entity';
import {
  formatRRuleString,
  TaskOccurrenceStatus,
  TaskPriority,
} from '@todo/shared';
import { calculateNextOccurrence } from '../utils/recurrence.util';

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

import { User } from '@/src/modules/users/user.entity';
import { MailerSchedulerService } from '@/src/modules/mailer/services/mailer-scheduler.service';

@Injectable()
export class TaskService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(Task) private readonly taskRepository: Repository<Task>,
    @InjectRepository(TaskOccurrence)
    private readonly taskOccurrenceRepository: Repository<TaskOccurrence>,
    @InjectRepository(Section)
    private readonly sectionRepository: Repository<Section>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly mailerSchedulerService: MailerSchedulerService,
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

      const createdTask = {
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
        occurrences: [],
      } as unknown as Task;

      if (timeRangeStart) {
        this.userRepository
          .findOne({ where: { id: ownerId } })
          .then((user) => {
            if (user) {
              const dueTime = new Date(timeRangeStart);
              const reminderTime = new Date(dueTime.getTime() - 15 * 60 * 1000);
              return this.mailerSchedulerService.scheduleTaskReminder({
                taskId: createdTask.id,
                userId: ownerId,
                to: user.email,
                userName: user.name,
                taskTitle: createdTask.title,
                dueTime,
                reminderTime,
              });
            }
          })
          .catch(() => {});
      }

      return createdTask;
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
      .where('task.completedAt IS NULL')
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
    const occurrences = await this.taskOccurrenceRepository
      .createQueryBuilder('occurrence')
      .innerJoinAndSelect('occurrence.task', 'task')
      .innerJoinAndSelect('task.section', 'section')
      .innerJoinAndSelect('section.project', 'project')
      .where('project.ownerId = :ownerId', { ownerId })
      .andWhere('occurrence.status = :status', {
        status: TaskOccurrenceStatus.COMPLETED,
      })
      .andWhere(
        'occurrence.completedAt BETWEEN :rangeStart::timestamptz AND :rangeEnd::timestamptz',
        {
          rangeStart: rangeStartISO8601,
          rangeEnd: rangeEndISO8601,
        },
      )
      .orderBy('occurrence.completedAt', 'DESC')
      .getMany();

    return occurrences.map((occ) => {
      const task = occ.task;
      task.completedAt = occ.completedAt;
      return task;
    });
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
    const savedTask = await this.taskRepository.save(task);

    if (savedTask.completedAt !== null) {
      await this.mailerSchedulerService.cancelTaskReminder(id);
      await this.mailerSchedulerService.cancelRecurringTaskReminder(id);
    } else if (updatedTask.timeRange?.start) {
      const section = await this.sectionRepository.findOne({
        where: { id: savedTask.sectionId },
        relations: { project: true },
      });

      if (section?.project?.ownerId) {
        const user = await this.userRepository.findOne({
          where: { id: section.project.ownerId },
        });
        if (user) {
          const dueTime = new Date(updatedTask.timeRange.start);
          const reminderTime = new Date(dueTime.getTime() - 15 * 60 * 1000);
          this.mailerSchedulerService
            .scheduleTaskReminder({
              taskId: savedTask.id,
              userId: user.id,
              to: user.email,
              userName: user.name,
              taskTitle: savedTask.title,
              dueTime,
              reminderTime,
            })
            .catch(() => {});
        }
      }
    }

    return this.taskRepository.findOne({
      where: { id: savedTask.id },
      relations: {
        section: {
          project: true,
        },
        labels: true,
        recurrence: true,
      },
    });
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
    await this.mailerSchedulerService.cancelTaskReminder(id);
    await this.mailerSchedulerService.cancelRecurringTaskReminder(id);
    const result = await this.taskRepository.delete(id);
    return result.affected !== 0;
  }

  async completeTaskOccurrence(
    userId: string,
    taskId: string,
    options?: {
      scheduledDate?: Date;
      completedAt?: Date;
    },
  ): Promise<{
    occurrenceId: string;
    taskId: string;
    isRecurringAdvanced: boolean;
    status: TaskOccurrenceStatus;
    completedAt: string;
    nextDueTime?: string | null;
  }> {
    const completedAt = options?.completedAt ?? new Date();

    return this.dataSource.transaction(async (manager) => {
      const task = await manager.findOne(Task, {
        where: { id: taskId },
        relations: {
          recurrence: true,
          section: { project: true },
        },
      });

      if (!task) {
        throw new NotFoundException(`Task with ID ${taskId} not found`);
      }
      if (task.section?.project?.ownerId !== userId) {
        throw new ForbiddenException(
          'You do not have permission to modify this task',
        );
      }

      const scheduledDate =
        options?.scheduledDate ??
        (task.timeRange?.start ? new Date(task.timeRange.start) : null);

      // Record occurrence completion
      const occurrence = manager.create(TaskOccurrence, {
        taskId: task.id,
        userId,
        scheduledDate,
        status: TaskOccurrenceStatus.COMPLETED,
        completedAt,
      });
      const savedOccurrence = await manager.save(TaskOccurrence, occurrence);

      let isRecurringAdvanced = false;
      let nextDueTime: string | null = null;

      if (task.recurrence?.rrule) {
        const anchor = scheduledDate ?? completedAt;
        const dtstart = task.timeRange?.start
          ? new Date(task.timeRange.start)
          : anchor;
        const nextOccurrence = calculateNextOccurrence(
          task.recurrence.rrule,
          anchor,
          dtstart,
        );

        if (nextOccurrence) {
          let durationMs = 0;
          if (task.timeRange?.start && task.timeRange?.end) {
            durationMs =
              new Date(task.timeRange.end).getTime() -
              new Date(task.timeRange.start).getTime();
          }

          const nextStart = nextOccurrence;
          const nextEnd =
            durationMs > 0
              ? new Date(nextStart.getTime() + durationMs)
              : nextStart;

          task.timeRange = {
            start: nextStart.toISOString(),
            end: nextEnd.toISOString(),
          };
          task.completedAt = null; // Remains active for next occurrence
          isRecurringAdvanced = true;
          nextDueTime = nextStart.toISOString();

          // Reschedule recurring email reminder
          const user = await manager.findOne(User, { where: { id: userId } });
          if (user && task.recurrence.rrule) {
            const rruleStr = formatRRuleString(task.recurrence.rrule);
            await this.mailerSchedulerService
              .scheduleRecurringTaskReminder({
                taskId: task.id,
                userId: user.id,
                to: user.email,
                userName: user.name,
                taskTitle: task.title,
                rruleString: rruleStr,
                reminderOffsetMinutes: 15,
              })
              .catch(() => {});
          }
        } else {
          // Recurrence series finished (e.g., COUNT or UNTIL exceeded)
          task.completedAt = completedAt;
          await this.mailerSchedulerService.cancelRecurringTaskReminder(
            task.id,
          );
        }
      } else {
        // Non-recurring task: terminal completion
        task.completedAt = completedAt;
        await this.mailerSchedulerService.cancelTaskReminder(task.id);
      }

      await manager.save(Task, task);

      return {
        occurrenceId: savedOccurrence.id,
        taskId: task.id,
        isRecurringAdvanced,
        status: TaskOccurrenceStatus.COMPLETED,
        completedAt: completedAt.toISOString(),
        nextDueTime,
      };
    });
  }

  async completeTask(userId: string, taskId: string, completedAtDate?: Date) {
    return this.completeTaskOccurrence(userId, taskId, {
      completedAt: completedAtDate,
    });
  }

  async uncompleteTaskOccurrence(
    userId: string,
    taskId: string,
  ): Promise<Task> {
    return this.dataSource.transaction(async (manager) => {
      const task = await manager.findOne(Task, {
        where: { id: taskId },
        relations: {
          recurrence: true,
          section: { project: true },
          labels: true,
        },
      });

      if (!task) {
        throw new NotFoundException(`Task with ID ${taskId} not found`);
      }
      if (task.section?.project?.ownerId !== userId) {
        throw new ForbiddenException(
          'You do not have permission to modify this task',
        );
      }

      // Find and remove latest completed occurrence for this task
      const latestOccurrence = await manager.findOne(TaskOccurrence, {
        where: {
          taskId: task.id,
          userId,
          status: TaskOccurrenceStatus.COMPLETED,
        },
        order: { completedAt: 'DESC' },
      });

      if (latestOccurrence) {
        await manager.remove(TaskOccurrence, latestOccurrence);

        // If recurring task had a recorded scheduledDate, roll back timeRange
        if (task.recurrence && latestOccurrence.scheduledDate) {
          let durationMs = 0;
          if (task.timeRange?.start && task.timeRange?.end) {
            durationMs =
              new Date(task.timeRange.end).getTime() -
              new Date(task.timeRange.start).getTime();
          }

          const revertedStart = latestOccurrence.scheduledDate;
          const revertedEnd =
            durationMs > 0
              ? new Date(revertedStart.getTime() + durationMs)
              : revertedStart;

          task.timeRange = {
            start: revertedStart.toISOString(),
            end: revertedEnd.toISOString(),
          };
        }
      }

      task.completedAt = null;
      const savedTask = await manager.save(Task, task);

      // Reschedule reminder if appropriate
      if (savedTask.timeRange?.start) {
        const user = await manager.findOne(User, { where: { id: userId } });
        if (user) {
          if (savedTask.recurrence?.rrule) {
            await this.mailerSchedulerService
              .scheduleRecurringTaskReminder({
                taskId: savedTask.id,
                userId: user.id,
                to: user.email,
                userName: user.name,
                taskTitle: savedTask.title,
                rruleString: formatRRuleString(savedTask.recurrence.rrule),
                reminderOffsetMinutes: 15,
              })
              .catch(() => {});
          } else {
            const dueTime = new Date(savedTask.timeRange.start);
            const reminderTime = new Date(dueTime.getTime() - 15 * 60 * 1000);
            await this.mailerSchedulerService
              .scheduleTaskReminder({
                taskId: savedTask.id,
                userId: user.id,
                to: user.email,
                userName: user.name,
                taskTitle: savedTask.title,
                dueTime,
                reminderTime,
              })
              .catch(() => {});
          }
        }
      }

      return savedTask;
    });
  }

  async uncompleteTask(userId: string, taskId: string): Promise<Task> {
    return this.uncompleteTaskOccurrence(userId, taskId);
  }

  async postponeTask(
    userId: string,
    taskId: string,
    postponeTo: Date,
  ): Promise<Task> {
    const task = await this.taskRepository.findOne({
      where: { id: taskId },
      relations: {
        recurrence: true,
        section: { project: true },
        labels: true,
      },
    });

    if (!task) {
      throw new NotFoundException(`Task with ID ${taskId} not found`);
    }
    if (task.section?.project?.ownerId !== userId) {
      throw new ForbiddenException(
        'You do not have permission to modify this task',
      );
    }

    let durationMs = 0;
    if (task.timeRange?.start && task.timeRange?.end) {
      durationMs =
        new Date(task.timeRange.end).getTime() -
        new Date(task.timeRange.start).getTime();
    }

    const newStart = postponeTo;
    const newEnd =
      durationMs > 0 ? new Date(newStart.getTime() + durationMs) : newStart;

    task.timeRange = {
      start: newStart.toISOString(),
      end: newEnd.toISOString(),
    };
    task.completedAt = null;

    const savedTask = await this.taskRepository.save(task);

    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (user) {
      if (savedTask.recurrence?.rrule) {
        await this.mailerSchedulerService
          .scheduleRecurringTaskReminder({
            taskId: savedTask.id,
            userId: user.id,
            to: user.email,
            userName: user.name,
            taskTitle: savedTask.title,
            rruleString: formatRRuleString(savedTask.recurrence.rrule),
            reminderOffsetMinutes: 15,
          })
          .catch(() => {});
      } else {
        const dueTime = newStart;
        const reminderTime = new Date(dueTime.getTime() - 15 * 60 * 1000);
        await this.mailerSchedulerService
          .scheduleTaskReminder({
            taskId: savedTask.id,
            userId: user.id,
            to: user.email,
            userName: user.name,
            taskTitle: savedTask.title,
            dueTime,
            reminderTime,
          })
          .catch(() => {});
      }
    }

    return savedTask;
  }
}
