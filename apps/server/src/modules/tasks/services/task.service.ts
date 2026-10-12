import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import {
  DataSource,
  EntityManager,
  In,
  Repository,
  SelectQueryBuilder,
} from 'typeorm';
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

import { User } from '@/src/modules/users/user.entity';
import { TaskReminder } from '../entities/task-reminder.entity';
import { TaskLabel } from '@/src/modules/task-labels/task-label.entity';
import { MailerSchedulerService } from '@/src/modules/mailer/services/mailer-scheduler.service';

export const DEFAULT_REMINDER_OFFSET_MINUTES = 30;

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

@Injectable()
export class TaskService {
  private readonly logger = new Logger(TaskService.name);

  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(Task) private readonly taskRepository: Repository<Task>,
    @InjectRepository(TaskOccurrence)
    private readonly taskOccurrenceRepository: Repository<TaskOccurrence>,
    @InjectRepository(TaskReminder)
    private readonly taskReminderRepository: Repository<TaskReminder>,
    @InjectRepository(TaskLabel)
    private readonly taskLabelRepository: Repository<TaskLabel>,
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

    const section = await this.sectionRepository.findOne({
      where: { id: createTaskDto.sectionId, project: { ownerId } },
    });
    if (!section) {
      throw new NotFoundException(
        `Section with ID ${createTaskDto.sectionId} not found`,
      );
    }

    if (labelIds && labelIds.length > 0) {
      const ownedLabelsCount = await this.taskLabelRepository.count({
        where: { id: In(labelIds), ownerId },
      });
      if (ownedLabelsCount !== labelIds.length) {
        throw new ForbiddenException('One or more labels do not belong to you');
      }
    }

    try {
      const { rawTask, savedReminders } = await this.dataSource.transaction(
        async (manager) => {
          const [raw] = await manager.query<[RawTaskRow]>(
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
              createTaskDto.priority ?? TaskPriority.LOW,
              timeRangeStart,
              timeRangeEnd,
              labelIds,
            ],
          );

          const reminders: TaskReminder[] = [];
          if (createTaskDto.reminders && createTaskDto.reminders.length > 0) {
            const remEntities = createTaskDto.reminders.map((remDto) =>
              manager.create(TaskReminder, {
                taskId: raw.id,
                userId: ownerId,
                type: remDto.type,
                minuteOffset:
                  remDto.minuteOffset ?? DEFAULT_REMINDER_OFFSET_MINUTES,
                remindAt: remDto.remindAt ? new Date(remDto.remindAt) : null,
                channel: remDto.channel,
              }),
            );
            reminders.push(...(await manager.save(TaskReminder, remEntities)));
          }

          return { rawTask: raw, savedReminders: reminders };
        },
      );

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
        try {
          const user = await this.userRepository.findOne({
            where: { id: ownerId },
          });
          if (user) {
            const dueTime = new Date(timeRangeStart);
            for (const rem of savedReminders) {
              const offset =
                rem.minuteOffset ?? DEFAULT_REMINDER_OFFSET_MINUTES;
              const reminderTime = new Date(
                dueTime.getTime() - offset * 60 * 1000,
              );
              await this.mailerSchedulerService
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
                .catch((err) => {
                  this.logger.error(
                    `Failed to schedule task reminder ${rem.id}`,
                    err,
                  );
                });
            }
          }
        } catch (err) {
          this.logger.error(
            `Failed to find user ${ownerId} for scheduling reminders`,
            err,
          );
        }
      }

      return createdTask;
    } catch (error: unknown) {
      handleDatabaseOrderingError(error);
    }
  }

  /**
   * Filters tasks that have ANY of the given labels without touching the `label`
   * join, so the response still contains every label of the matching tasks.
   */
  private applyLabelFilter<T extends object>(
    queryBuilder: SelectQueryBuilder<T>,
    taskLabelIds?: string[],
  ): void {
    if (!taskLabelIds || taskLabelIds.length === 0) {
      return;
    }
    queryBuilder.andWhere(
      `EXISTS (
        SELECT 1 FROM task_to_task_labels filter_tl
        WHERE filter_tl.task_id = task.id
          AND filter_tl.task_label_id IN (:...taskLabelIds)
      )`,
      { taskLabelIds },
    );
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
        queryBuilder
          .orderBy('task.sectionId', 'ASC')
          .addOrderBy('task.lexorank COLLATE "C"', 'ASC');
      }

      this.applyLabelFilter(queryBuilder, filter.taskLabelIds);
      queryBuilder.leftJoin('task.labels', 'label');

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
        queryBuilder
          .orderBy('task.sectionId', 'ASC')
          .addOrderBy('task.lexorank COLLATE "C"', 'ASC');
      }

      this.applyLabelFilter(queryBuilder, filter.taskLabelIds);
      queryBuilder.leftJoin('task.labels', 'label');

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

    this.applyLabelFilter(queryBuilder, filter.taskLabelIds);

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
        completedAt: occ.completedAt ? occ.completedAt.toISOString() : null,
        recurrence: task.recurrence?.rrule ?? null,
        occurrenceId: occ.id,
        scheduledDate: occ.scheduledDate
          ? occ.scheduledDate.toISOString()
          : null,
        isLatestOccurrence: isLatest,
        reminders: (task.reminders ?? []).map((r) =>
          r.type === 'relative'
            ? {
                id: r.id,
                type: 'relative' as const,
                minuteOffset: r.minuteOffset ?? 0,
                channel: r.channel,
              }
            : {
                id: r.id,
                type: 'absolute' as const,
                remindAt: r.remindAt
                  ? r.remindAt.toISOString()
                  : new Date().toISOString(),
                channel: r.channel,
              },
        ),
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
      .orderBy('task.sectionId', 'ASC')
      .addOrderBy('task.lexorank COLLATE "C"', 'ASC')
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
        completedAt: occ.completedAt ? occ.completedAt.toISOString() : null,
        recurrence: task.recurrence?.rrule ?? null,
        occurrenceId: occ.id,
        scheduledDate: occ.scheduledDate
          ? occ.scheduledDate.toISOString()
          : null,
        isLatestOccurrence: isLatest,
        reminders: (task.reminders ?? []).map((r) =>
          r.type === 'relative'
            ? {
                id: r.id,
                type: 'relative' as const,
                minuteOffset: r.minuteOffset ?? 0,
                channel: r.channel,
              }
            : {
                id: r.id,
                type: 'absolute' as const,
                remindAt: r.remindAt
                  ? r.remindAt.toISOString()
                  : new Date().toISOString(),
                channel: r.channel,
              },
        ),
      };
    });
  }

  async updateTask(
    id: string,
    updatedTask: UpdateTaskDto,
    actingUserId?: string,
  ): Promise<Task> {
    const task = await this.taskRepository.findOne({
      where: actingUserId
        ? { id, section: { project: { ownerId: actingUserId } } }
        : { id },
      relations: {
        section: { project: true },
        labels: true,
        recurrence: true,
        reminders: true,
      },
    });
    if (!task) {
      throw new NotFoundException(`Task with ID ${id} not found`);
    }

    const ownerId = actingUserId ?? task.section?.project?.ownerId;
    if (!ownerId) {
      throw new ForbiddenException('Cannot determine task owner');
    }

    if (updatedTask.sectionId && updatedTask.sectionId !== task.sectionId) {
      const targetSection = await this.sectionRepository.findOne({
        where: { id: updatedTask.sectionId, project: { ownerId } },
      });
      if (!targetSection) {
        throw new NotFoundException(
          `Target section with ID ${updatedTask.sectionId} not found`,
        );
      }
    }

    if (updatedTask.labels && updatedTask.labels.length > 0) {
      const labelIds = updatedTask.labels.map((l) => l.id);
      const ownedLabelsCount = await this.taskLabelRepository.count({
        where: { id: In(labelIds), ownerId },
      });
      if (ownedLabelsCount !== labelIds.length) {
        throw new ForbiddenException('One or more labels do not belong to you');
      }
    }

    const existingReminders = task.reminders ?? [];

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

    const { reminders: remindersDto } = updatedTask;

    await this.dataSource.transaction(async (manager) => {
      if (updatedTask.sectionId && updatedTask.sectionId !== task.sectionId) {
        await manager.query(
          `
            SELECT move_task(
              $1::uuid,
              $2::uuid,
              $3::uuid,
              $4::uuid
            );
          `,
          [ownerId, task.id, updatedTask.sectionId, null],
        );
        task.sectionId = updatedTask.sectionId;
      }

      if (updatedTask.title !== undefined) {
        task.title = updatedTask.title;
      }
      if (updatedTask.description !== undefined) {
        task.description = updatedTask.description;
      }
      if (updatedTask.priority !== undefined) {
        task.priority = updatedTask.priority;
      }
      if (updatedTask.timeRange !== undefined) {
        task.timeRange = updatedTask.timeRange;
      }
      if (updatedTask.labels !== undefined) {
        task.labels = updatedTask.labels.map(
          (l) => ({ id: l.id }) as TaskLabel,
        );
      }

      if (remindersDto !== undefined) {
        await manager.delete(TaskReminder, { taskId: id });
        if (remindersDto.length > 0) {
          const remEntities = remindersDto.map((remDto) =>
            manager.create(TaskReminder, {
              taskId: id,
              userId: ownerId,
              type: remDto.type,
              minuteOffset:
                remDto.minuteOffset ?? DEFAULT_REMINDER_OFFSET_MINUTES,
              remindAt: remDto.remindAt ? new Date(remDto.remindAt) : null,
              channel: remDto.channel,
            }),
          );
          task.reminders = await manager.save(TaskReminder, remEntities);
        } else {
          task.reminders = [];
        }
      }

      await manager.save(Task, task);
    });

    if (remindersDto !== undefined) {
      for (const old of existingReminders) {
        await this.mailerSchedulerService
          .cancelTaskReminder(old.id)
          .catch((err) =>
            this.logger.error(`Failed to cancel reminder ${old.id}`, err),
          );
        await this.mailerSchedulerService
          .cancelRecurringTaskReminder(old.id)
          .catch((err) =>
            this.logger.error(
              `Failed to cancel recurring reminder ${old.id}`,
              err,
            ),
          );
      }
    }

    try {
      await this.rescheduleTaskReminders(task, ownerId);
    } catch (err) {
      this.logger.error(
        `Failed to reschedule reminders for task ${task.id}`,
        err,
      );
    }

    const refreshedTask = await this.getTaskById(task.id);
    if (!refreshedTask) {
      throw new NotFoundException(`Task with ID ${task.id} not found`);
    }
    return refreshedTask;
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

  async deleteTask(id: string, ownerId?: string): Promise<void> {
    const task = await this.taskRepository.findOne({
      where: ownerId ? { id, section: { project: { ownerId } } } : { id },
      relations: { reminders: true },
    });
    if (!task) {
      throw new NotFoundException(`Task with ID ${id} not found`);
    }

    const reminders = task.reminders ?? [];

    const result = await this.taskRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Task with ID ${id} not found`);
    }

    for (const rem of reminders) {
      this.mailerSchedulerService
        .cancelTaskReminder(rem.id)
        .catch((err) =>
          this.logger.error(`Failed to cancel reminder ${rem.id}`, err),
        );
      this.mailerSchedulerService
        .cancelRecurringTaskReminder(rem.id)
        .catch((err) =>
          this.logger.error(
            `Failed to cancel recurring reminder ${rem.id}`,
            err,
          ),
        );
    }
    this.mailerSchedulerService
      .cancelTaskReminder(id)
      .catch((err) =>
        this.logger.error(`Failed to cancel task reminder ${id}`, err),
      );
    this.mailerSchedulerService
      .cancelRecurringTaskReminder(id)
      .catch((err) =>
        this.logger.error(`Failed to cancel recurring reminder ${id}`, err),
      );
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

    const { result, taskToReschedule } = await this.dataSource.transaction(
      async (manager) => {
        const task = await manager.findOne(Task, {
          where: { id: taskId },
          relations: {
            recurrence: true,
            section: { project: true },
          },
          lock: { mode: 'pessimistic_write' },
        });

        if (!task) {
          throw new NotFoundException(`Task with ID ${taskId} not found`);
        }
        if (task.section?.project?.ownerId !== userId) {
          throw new ForbiddenException(
            'You do not have permission to modify this task',
          );
        }

        if (!task.recurrence && task.completedAt !== null) {
          const existingOcc = await manager.findOne(TaskOccurrence, {
            where: { taskId: task.id, status: TaskOccurrenceStatus.COMPLETED },
            order: { completedAt: 'DESC' },
          });
          return {
            result: {
              occurrenceId: existingOcc ? existingOcc.id : taskId,
              taskId: task.id,
              isRecurringAdvanced: false,
              status: TaskOccurrenceStatus.COMPLETED,
              completedAt: (task.completedAt ?? completedAt).toISOString(),
              nextDueTime: null,
            },
            taskToReschedule: null,
          };
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
          } else {
            // Recurrence series finished (e.g., COUNT or UNTIL exceeded)
            task.completedAt = completedAt;
          }
        } else {
          // Non-recurring task: terminal completion
          task.completedAt = completedAt;
        }

        await manager.save(Task, task);

        return {
          result: {
            occurrenceId: savedOccurrence.id,
            taskId: task.id,
            isRecurringAdvanced,
            status: TaskOccurrenceStatus.COMPLETED,
            completedAt: completedAt.toISOString(),
            nextDueTime,
          },
          taskToReschedule: task,
        };
      },
    );

    if (taskToReschedule) {
      try {
        await this.rescheduleTaskReminders(taskToReschedule, userId);
      } catch (err) {
        this.logger.error(
          `Failed to reschedule reminders for completed task ${taskToReschedule.id}`,
          err,
        );
      }
    }

    return result;
  }

  async uncompleteOccurrenceById(
    userId: string,
    occurrenceId: string,
  ): Promise<Task> {
    const savedTask = await this.dataSource.transaction(async (manager) => {
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

      const saved = await manager.save(Task, task);
      return saved;
    });

    try {
      await this.rescheduleTaskReminders(savedTask, userId);
    } catch (err) {
      this.logger.error(
        `Failed to reschedule reminders for uncompleted task ${savedTask.id}`,
        err,
      );
    }

    return savedTask;
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
    this.rescheduleTaskReminders(saved, userId).catch((err) =>
      this.logger.error(
        `Failed to reschedule reminders for uncompleted task ${saved.id}`,
        err,
      ),
    );
    return saved;
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
    try {
      await this.rescheduleTaskReminders(savedTask, userId);
    } catch (err) {
      this.logger.error(
        `Failed to reschedule reminders for postponed task ${savedTask.id}`,
        err,
      );
    }

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
            reminderOffsetMinutes:
              rem.minuteOffset ?? DEFAULT_REMINDER_OFFSET_MINUTES,
          })
          .catch(() => {});
      }
    } else if (task.timeRange?.start) {
      const dueTime = new Date(task.timeRange.start);
      for (const rem of reminders) {
        const offset = rem.minuteOffset ?? DEFAULT_REMINDER_OFFSET_MINUTES;
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
