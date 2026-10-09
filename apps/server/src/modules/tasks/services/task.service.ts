import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { randomUUID } from 'node:crypto';
import { Task } from '../entities/task.entity';
import { TaskOccurrence } from '../entities/task-occurrence.entity';
import { InjectRepository } from '@nestjs/typeorm';

import { CreateTaskDto, UpdateTaskDto } from '../dto/add-task.dto';
import { TaskFilterDto } from '../dto/get-my-tasks.dto';
import { Section } from '@/src/modules/sections/section.entity';
import {
  CompletedOccurrenceResponseDto,
  formatRRuleString,
  TaskOccurrenceStatus,
  TaskPriority,
} from '@todo/shared';
import { calculateNextOccurrence } from '../utils/recurrence.util';

interface RawTaskRow {
  id: string;
  title: string;
  description: string;
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
import { TaskReminder } from '../entities/task-reminder.entity';
import { MailerSchedulerService } from '@/src/modules/mailer/services/mailer-scheduler.service';

@Injectable()
export class TaskService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(Task) private readonly taskRepository: Repository<Task>,
    @InjectRepository(TaskOccurrence)
    private readonly taskOccurrenceRepository: Repository<TaskOccurrence>,
    @InjectRepository(TaskReminder)
    private readonly taskReminderRepository: Repository<TaskReminder>,
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

    const hasRelativeReminder = createTaskDto.reminders?.some(
      (r) => r.type === 'relative',
    );
    if (hasRelativeReminder && !timeRangeStart) {
      throw new BadRequestException(
        'Relative reminders require a task start date/time or recurrence pattern.',
      );
    }

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
          createTaskDto.description ?? '',
          createTaskDto.priority ?? 'high',
          timeRangeStart,
          timeRangeEnd,
          labelIds,
        ],
      );

      const savedReminders: TaskReminder[] = [];
      if (createTaskDto.reminders && createTaskDto.reminders.length > 0) {
        for (const remDto of createTaskDto.reminders) {
          const rem = this.taskReminderRepository.create({
            taskId: rawTask.id,
            userId: ownerId,
            type: remDto.type,
            minuteOffset: remDto.minuteOffset ?? 30,
            remindAt: remDto.remindAt ? new Date(remDto.remindAt) : null,
            channel: remDto.channel,
          });
          savedReminders.push(await this.taskReminderRepository.save(rem));
        }
      }

      const createdTask = {
        id: rawTask.id,
        title: rawTask.title,
        description: rawTask.description ?? '',
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
        reminders: savedReminders,
      } as unknown as Task;

      if (timeRangeStart && savedReminders.length > 0) {
        this.userRepository
          .findOne({ where: { id: ownerId } })
          .then((user) => {
            if (user) {
              const dueTime = new Date(timeRangeStart);
              for (const rem of savedReminders) {
                const offset = rem.minuteOffset ?? 30;
                const reminderTime = new Date(
                  dueTime.getTime() - offset * 60 * 1000,
                );
                this.mailerSchedulerService
                  .scheduleTaskReminder({
                    taskId: createdTask.id,
                    reminderId: rem.id,
                    userId: ownerId,
                    to: user.email,
                    userName: user.name,
                    taskTitle: createdTask.title,
                    dueTime,
                    reminderTime,
                    reminderOffsetMinutes: offset,
                  })
                  .catch(() => {});
              }
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
    return this.taskRepository.findOne({
      where: { id },
      relations: {
        section: {
          project: true,
        },
        labels: true,
        recurrence: true,
        reminders: true,
      },
    });
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
        .leftJoin('task.recurrence', 'recurrence')
        .leftJoin('task.reminders', 'reminder')
        .where('task.completedAt IS NULL');

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
        'reminder.id',
        'reminder.type',
        'reminder.minuteOffset',
        'reminder.remindAt',
        'reminder.channel',
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
        .leftJoin('task.recurrence', 'recurrence')
        .leftJoin('task.reminders', 'reminder')
        .andWhere('task.completedAt IS NULL');

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
        'reminder.id',
        'reminder.type',
        'reminder.minuteOffset',
        'reminder.remindAt',
        'reminder.channel',
      ]);

      return queryBuilder.getMany();
    });
  }

  async getCompletedOccurrencesByOwnerIdAndFilter(
    ownerId: string,
    filter: TaskFilterDto,
  ): Promise<CompletedOccurrenceResponseDto[]> {
    const queryBuilder = this.taskOccurrenceRepository
      .createQueryBuilder('occurrence')
      .innerJoinAndSelect('occurrence.task', 'task')
      .innerJoinAndSelect('task.section', 'section')
      .innerJoinAndSelect('section.project', 'project')
      .leftJoinAndSelect('task.labels', 'label')
      .leftJoinAndSelect('task.recurrence', 'recurrence')
      .leftJoinAndSelect('task.reminders', 'reminder')
      .where('occurrence.userId = :ownerId', { ownerId })
      .andWhere('occurrence.status = :status', {
        status: TaskOccurrenceStatus.COMPLETED,
      });

    if (filter.projectId) {
      queryBuilder.andWhere('project.id = :projectId', {
        projectId: filter.projectId,
      });
    }

    if (filter.taskLabelIds && filter.taskLabelIds.length > 0) {
      queryBuilder.andWhere('label.id IN (:...taskLabelIds)', {
        taskLabelIds: filter.taskLabelIds,
      });
    }

    if (filter.title) {
      queryBuilder.andWhere('task.title ILIKE :title', {
        title: `%${filter.title}%`,
      });
    }

    queryBuilder.orderBy('occurrence.completedAt', 'DESC').take(100);

    const occurrences = await queryBuilder.getMany();

    const latestOccurrencesByTask = new Map<string, string>();
    for (const occ of occurrences) {
      if (!latestOccurrencesByTask.has(occ.taskId)) {
        latestOccurrencesByTask.set(occ.taskId, occ.id);
      }
    }

    return occurrences.map((occ) => {
      const task = occ.task;
      const isLatest =
        !task.recurrence || latestOccurrencesByTask.get(task.id) === occ.id;

      return {
        id: task.id,
        title: task.title,
        description: task.description ?? '',
        priority: task.priority,
        sectionId: task.sectionId,
        section: {
          id: task.section.id,
          name: task.section.name,
          project: {
            id: task.section.project.id,
            name: task.section.project.name,
          },
        },
        labels: (task.labels ?? []).map((l) => ({ id: l.id })),
        timeRange: task.timeRange,
        completedAt: occ.completedAt
          ? occ.completedAt.toISOString()
          : new Date().toISOString(),
        recurrence: task.recurrence?.rrule ?? null,
        occurrenceId: occ.id,
        scheduledDate: occ.scheduledDate
          ? occ.scheduledDate.toISOString()
          : null,
        isLatestOccurrence: isLatest,
        reminders: (task.reminders ?? []).map((r) => ({
          id: r.id,
          type: r.type,
          minuteOffset: r.minuteOffset,
          remindAt: r.remindAt ? r.remindAt.toISOString() : null,
          channel: r.channel,
        })),
      };
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
      .leftJoin('task.reminders', 'reminder')
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
        'reminder.id',
        'reminder.type',
        'reminder.minuteOffset',
        'reminder.remindAt',
        'reminder.channel',
      ])
      .orderBy('task.lexorank', 'ASC')
      .getMany();
  }

  async getTasksByOwnerIdThatCompletedInTimeRange(
    ownerId: string,
    rangeStartISO8601: string,
    rangeEndISO8601: string,
  ): Promise<CompletedOccurrenceResponseDto[]> {
    const occurrences = await this.taskOccurrenceRepository
      .createQueryBuilder('occurrence')
      .innerJoinAndSelect('occurrence.task', 'task')
      .innerJoinAndSelect('task.section', 'section')
      .innerJoinAndSelect('section.project', 'project')
      .leftJoinAndSelect('task.labels', 'label')
      .leftJoinAndSelect('task.recurrence', 'recurrence')
      .leftJoinAndSelect('task.reminders', 'reminder')
      .where('occurrence.userId = :ownerId', { ownerId })
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

    const latestOccurrencesByTask = new Map<string, string>();
    for (const occ of occurrences) {
      if (!latestOccurrencesByTask.has(occ.taskId)) {
        latestOccurrencesByTask.set(occ.taskId, occ.id);
      }
    }

    return occurrences.map((occ) => {
      const task = occ.task;
      const isLatest =
        !task.recurrence || latestOccurrencesByTask.get(task.id) === occ.id;

      return {
        id: task.id,
        title: task.title,
        description: task.description ?? '',
        priority: task.priority,
        sectionId: task.sectionId,
        section: {
          id: task.section.id,
          name: task.section.name,
          project: {
            id: task.section.project.id,
            name: task.section.project.name,
          },
        },
        labels: (task.labels ?? []).map((l) => ({ id: l.id })),
        timeRange: task.timeRange,
        completedAt: occ.completedAt
          ? occ.completedAt.toISOString()
          : new Date().toISOString(),
        recurrence: task.recurrence?.rrule ?? null,
        occurrenceId: occ.id,
        scheduledDate: occ.scheduledDate
          ? occ.scheduledDate.toISOString()
          : null,
        isLatestOccurrence: isLatest,
        reminders: (task.reminders ?? []).map((r) => ({
          id: r.id,
          type: r.type,
          minuteOffset: r.minuteOffset,
          remindAt: r.remindAt ? r.remindAt.toISOString() : null,
          channel: r.channel,
        })),
      };
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

    const section = await this.sectionRepository.findOne({
      where: { id: task.sectionId },
      relations: { project: true },
    });
    const ownerId = section?.project?.ownerId;

    const existingReminders = await this.taskReminderRepository.find({
      where: { taskId: id },
    });

    const willHaveRelativeReminder =
      updatedTask.reminders !== undefined
        ? updatedTask.reminders.some((r) => r.type === 'relative')
        : existingReminders.some((r) => r.type === 'relative');

    if (willHaveRelativeReminder) {
      const effectiveTimeRange =
        updatedTask.timeRange !== undefined
          ? updatedTask.timeRange
          : task.timeRange;

      if (!effectiveTimeRange?.start && !task.recurrence?.rrule) {
        throw new BadRequestException(
          'Relative reminders require a task start date/time or recurrence pattern.',
        );
      }
    }

    if (updatedTask.reminders !== undefined && ownerId) {
      const oldReminders = existingReminders;
      for (const old of oldReminders) {
        await this.mailerSchedulerService.cancelTaskReminder(old.id);
        await this.mailerSchedulerService.cancelRecurringTaskReminder(old.id);
      }
      await this.taskReminderRepository.delete({ taskId: id });

      for (const remDto of updatedTask.reminders) {
        const rem = this.taskReminderRepository.create({
          taskId: id,
          userId: ownerId,
          type: remDto.type,
          minuteOffset: remDto.minuteOffset ?? 30,
          remindAt: remDto.remindAt ? new Date(remDto.remindAt) : null,
          channel: remDto.channel,
        });
        await this.taskReminderRepository.save(rem);
      }
    }

    Object.assign(task, updatedTask);
    const savedTask = await this.taskRepository.save(task);

    if (ownerId) {
      await this.rescheduleTaskReminders(savedTask, ownerId);
    }

    return this.getTaskById(savedTask.id);
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
    const reminders = await this.taskReminderRepository.find({
      where: { taskId: id },
    });
    for (const rem of reminders) {
      await this.mailerSchedulerService.cancelTaskReminder(rem.id);
      await this.mailerSchedulerService.cancelRecurringTaskReminder(rem.id);
    }
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

          await this.rescheduleTaskReminders(task, userId, manager);
        } else {
          // Recurrence series finished (e.g., COUNT or UNTIL exceeded)
          task.completedAt = completedAt;
          await this.rescheduleTaskReminders(task, userId, manager);
        }
      } else {
        // Non-recurring task: terminal completion
        task.completedAt = completedAt;
        await this.rescheduleTaskReminders(task, userId, manager);
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

  async uncompleteOccurrenceById(
    userId: string,
    occurrenceId: string,
  ): Promise<Task> {
    return this.dataSource.transaction(async (manager) => {
      const occurrence = await manager.findOne(TaskOccurrence, {
        where: { id: occurrenceId },
        relations: {
          task: {
            recurrence: true,
            section: { project: true },
            labels: true,
          },
        },
      });

      if (!occurrence) {
        throw new NotFoundException(
          `Task occurrence with ID ${occurrenceId} not found`,
        );
      }

      const task = occurrence.task;
      if (!task) {
        throw new NotFoundException(
          `Task associated with occurrence ${occurrenceId} not found`,
        );
      }

      if (
        occurrence.userId !== userId &&
        task.section?.project?.ownerId !== userId
      ) {
        throw new ForbiddenException(
          'You do not have permission to modify this task',
        );
      }

      if (task.recurrence?.rrule) {
        const latestOccurrence = await manager.findOne(TaskOccurrence, {
          where: {
            taskId: task.id,
            userId,
            status: TaskOccurrenceStatus.COMPLETED,
          },
          order: { completedAt: 'DESC' },
        });

        if (latestOccurrence && latestOccurrence.id !== occurrence.id) {
          throw new ConflictException(
            'Only the latest completed occurrence of a recurring task can be uncompleted',
          );
        }

        await manager.remove(TaskOccurrence, occurrence);

        if (occurrence.scheduledDate) {
          let durationMs = 0;
          if (task.timeRange?.start && task.timeRange?.end) {
            durationMs =
              new Date(task.timeRange.end).getTime() -
              new Date(task.timeRange.start).getTime();
          }

          const revertedStart = occurrence.scheduledDate;
          const revertedEnd =
            durationMs > 0
              ? new Date(revertedStart.getTime() + durationMs)
              : revertedStart;

          task.timeRange = {
            start: revertedStart.toISOString(),
            end: revertedEnd.toISOString(),
          };
        }
      } else {
        await manager.remove(TaskOccurrence, occurrence);
        task.completedAt = null;
      }

      const savedTask = await manager.save(Task, task);

      await this.rescheduleTaskReminders(savedTask, userId, manager);

      return savedTask;
    });
  }

  async deleteOccurrenceById(
    userId: string,
    occurrenceId: string,
  ): Promise<boolean> {
    const occurrence = await this.taskOccurrenceRepository.findOne({
      where: { id: occurrenceId },
      relations: {
        task: {
          section: { project: true },
        },
      },
    });

    if (!occurrence) {
      throw new NotFoundException(
        `Task occurrence with ID ${occurrenceId} not found`,
      );
    }

    const task = occurrence.task;
    if (
      occurrence.userId !== userId &&
      task?.section?.project?.ownerId !== userId
    ) {
      throw new ForbiddenException(
        'You do not have permission to delete this occurrence',
      );
    }

    const result = await this.taskOccurrenceRepository.delete(occurrenceId);
    return result.affected !== 0;
  }

  async uncompleteTaskOccurrence(
    userId: string,
    taskId: string,
  ): Promise<Task> {
    const latestOccurrence = await this.taskOccurrenceRepository.findOne({
      where: {
        taskId,
        userId,
        status: TaskOccurrenceStatus.COMPLETED,
      },
      order: { completedAt: 'DESC' },
    });

    if (latestOccurrence) {
      return this.uncompleteOccurrenceById(userId, latestOccurrence.id);
    }

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
    task.completedAt = null;
    const saved = await this.taskRepository.save(task);
    await this.rescheduleTaskReminders(saved, userId);
    return saved;
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
    await this.rescheduleTaskReminders(savedTask, userId);

    return savedTask;
  }

  private async rescheduleTaskReminders(
    task: Task,
    userId: string,
    manager?: EntityManager,
  ): Promise<void> {
    const repo =
      manager && typeof manager.getRepository === 'function'
        ? manager.getRepository(TaskReminder)
        : this.taskReminderRepository;
    const reminders = await repo.find({ where: { taskId: task.id } });

    if (task.completedAt !== null) {
      await this.mailerSchedulerService.cancelTaskReminder(task.id);
      await this.mailerSchedulerService.cancelRecurringTaskReminder(task.id);
      for (const rem of reminders) {
        await this.mailerSchedulerService.cancelTaskReminder(rem.id);
        await this.mailerSchedulerService.cancelRecurringTaskReminder(rem.id);
      }
      return;
    }

    if (!reminders.length) return;

    if (!task.recurrence?.rrule && !task.timeRange?.start) {
      await this.mailerSchedulerService.cancelTaskReminder(task.id);
      await this.mailerSchedulerService.cancelRecurringTaskReminder(task.id);
      for (const rem of reminders) {
        await this.mailerSchedulerService.cancelTaskReminder(rem.id);
        await this.mailerSchedulerService.cancelRecurringTaskReminder(rem.id);
      }
      return;
    }

    const userRepo =
      manager && typeof manager.getRepository === 'function'
        ? manager.getRepository(User)
        : this.userRepository;
    const user = await userRepo.findOne({ where: { id: userId } });
    if (!user) return;

    if (task.recurrence?.rrule) {
      const rruleStr = formatRRuleString(task.recurrence.rrule);
      for (const rem of reminders) {
        await this.mailerSchedulerService
          .scheduleRecurringTaskReminder({
            taskId: task.id,
            reminderId: rem.id,
            userId: user.id,
            to: user.email,
            userName: user.name,
            taskTitle: task.title,
            rruleString: rruleStr,
            reminderOffsetMinutes: rem.minuteOffset ?? 30,
          })
          .catch(() => {});
      }
    } else if (task.timeRange?.start) {
      const dueTime = new Date(task.timeRange.start);
      for (const rem of reminders) {
        const offset = rem.minuteOffset ?? 30;
        const reminderTime = new Date(dueTime.getTime() - offset * 60 * 1000);
        await this.mailerSchedulerService
          .scheduleTaskReminder({
            taskId: task.id,
            reminderId: rem.id,
            userId: user.id,
            to: user.email,
            userName: user.name,
            taskTitle: task.title,
            dueTime,
            reminderTime,
            reminderOffsetMinutes: offset,
          })
          .catch(() => {});
      }
    }
  }
}
