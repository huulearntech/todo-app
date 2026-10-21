import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { TaskService } from './task.service';
import { Task } from '../entities/task.entity';
import { TaskOccurrence } from '../entities/task-occurrence.entity';
import { TaskReminder } from '../entities/task-reminder.entity';
import { Section } from '@/src/modules/sections/section.entity';
import {
  RecurrenceFrequency,
  TaskPriority,
  Weekday,
  type RRule,
  ProjectRole,
} from '@todo/shared';

import { User } from '@/src/modules/users/user.entity';
import { TaskLabel } from '@/src/modules/task-labels/task-label.entity';
import { MailerSchedulerService } from '@/src/modules/mailer/services/mailer-scheduler.service';
import { ProjectAccessService } from '@/src/modules/projects/authorization/project-access.service';

describe('TaskService', () => {
  let service: TaskService;
  let dataSource: { query: jest.Mock; transaction: jest.Mock };
  let taskRepository: {
    find: jest.Mock;
    findOne: jest.Mock;
    save: jest.Mock;
    delete: jest.Mock;
  };
  let taskOccurrenceRepository: {
    create: jest.Mock;
    save: jest.Mock;
    findOne: jest.Mock;
    remove: jest.Mock;
    delete: jest.Mock;
    createQueryBuilder: jest.Mock;
  };
  let taskReminderRepository: {
    create: jest.Mock;
    save: jest.Mock;
    find: jest.Mock;
    delete: jest.Mock;
  };
  let sectionRepository: { exists: jest.Mock; findOne: jest.Mock };
  let userRepository: { findOne: jest.Mock };
  let mailerSchedulerService: {
    scheduleTaskReminder: jest.Mock;
    cancelTaskReminder: jest.Mock;
    scheduleRecurringTaskReminder: jest.Mock;
    cancelRecurringTaskReminder: jest.Mock;
  };
  let projectAccessService: {
    assertCan: jest.Mock;
    getRole: jest.Mock;
  };

  beforeEach(async () => {
    const defaultManager = {
      query: jest.fn((...args) => dataSource.query(...args)),
      findOne: jest.fn((cls, opts) => {
        if (cls === User || cls?.name === 'User')
          return userRepository.findOne(opts);
        if (cls === Task || cls?.name === 'Task')
          return taskRepository.findOne(opts);
        if (cls === TaskOccurrence || cls?.name === 'TaskOccurrence')
          return taskOccurrenceRepository.findOne(opts);
        if (cls === TaskReminder || cls?.name === 'TaskReminder')
          return taskReminderRepository.find(opts);
        return null;
      }),
      create: jest.fn((cls, val) => {
        if (cls === TaskReminder || cls?.name === 'TaskReminder')
          return taskReminderRepository.create(val);
        return val;
      }),
      save: jest.fn((cls, val) => {
        if (cls === TaskReminder || cls?.name === 'TaskReminder')
          return taskReminderRepository.save(val);
        if (cls === Task || cls?.name === 'Task')
          return taskRepository.save(val);
        return Promise.resolve(val ?? cls);
      }),
      delete: jest.fn((cls, val) => {
        if (cls === TaskReminder || cls?.name === 'TaskReminder')
          return taskReminderRepository.delete(val);
        return Promise.resolve({ affected: 1 });
      }),
      remove: jest.fn().mockResolvedValue(undefined),
    };

    dataSource = {
      query: jest.fn(),
      transaction: jest.fn((cb) => cb(defaultManager)),
    };
    taskRepository = {
      find: jest.fn(),
      findOne: jest.fn(),
      save: jest.fn(),
      delete: jest.fn().mockResolvedValue({ affected: 1 }),
    };
    taskOccurrenceRepository = {
      create: jest.fn().mockImplementation((dto) => dto),
      save: jest.fn().mockImplementation((entity) => Promise.resolve(entity)),
      findOne: jest.fn(),
      remove: jest.fn(),
      delete: jest.fn(),
      createQueryBuilder: jest.fn(),
    };
    taskReminderRepository = {
      create: jest.fn().mockImplementation((dto) => dto),
      save: jest.fn().mockImplementation((entity) => Promise.resolve(entity)),
      find: jest.fn().mockResolvedValue([]),
      delete: jest.fn().mockResolvedValue({ affected: 1 }),
    };
    sectionRepository = {
      exists: jest.fn(),
      findOne: jest.fn().mockResolvedValue({
        id: 'section-1',
        project: {
          id: 'project-1',
          ownerId: '11111111-1111-1111-1111-111111111111',
        },
      }),
    };
    userRepository = {
      findOne: jest.fn().mockResolvedValue({
        id: 'user-uuid-1',
        email: 'user@example.com',
        name: 'User',
      }),
    };
    mailerSchedulerService = {
      scheduleTaskReminder: jest.fn().mockResolvedValue(undefined),
      cancelTaskReminder: jest.fn().mockResolvedValue(undefined),
      scheduleRecurringTaskReminder: jest.fn().mockResolvedValue(undefined),
      cancelRecurringTaskReminder: jest.fn().mockResolvedValue(undefined),
    };
    const taskLabelRepository = {
      count: jest.fn().mockResolvedValue(0),
      find: jest.fn(),
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TaskService,
        {
          provide: DataSource,
          useValue: dataSource,
        },
        {
          provide: getRepositoryToken(Task),
          useValue: taskRepository,
        },
        {
          provide: getRepositoryToken(TaskOccurrence),
          useValue: taskOccurrenceRepository,
        },
        {
          provide: getRepositoryToken(TaskReminder),
          useValue: taskReminderRepository,
        },
        {
          provide: getRepositoryToken(Section),
          useValue: sectionRepository,
        },
        {
          provide: getRepositoryToken(User),
          useValue: userRepository,
        },
        {
          provide: getRepositoryToken(TaskLabel),
          useValue: taskLabelRepository,
        },
        {
          provide: MailerSchedulerService,
          useValue: mailerSchedulerService,
        },
        {
          provide: ProjectAccessService,
          useValue: {
            assertCan: jest.fn().mockResolvedValue(ProjectRole.OWNER),
            getRole: jest.fn().mockResolvedValue(ProjectRole.OWNER),
          },
        },
      ],
    }).compile();

    service = module.get<TaskService>(TaskService);
    projectAccessService = module.get(ProjectAccessService);
  });

  describe('createTask', () => {
    const ownerId = '11111111-1111-1111-1111-111111111111';
    const sectionId = '22222222-2222-2222-2222-222222222222';

    it('should create and save task entity via TypeORM transaction', async () => {
      taskRepository.save.mockImplementation(async (entity: any) => ({
        ...entity,
        lexorank: 'm',
      }));

      const result = await service.createTask(ownerId, {
        title: 'New Task',
        sectionId,
        description: 'Task description',
        priority: TaskPriority.HIGH,
        labels: [],
        reminders: [],
        timeRange: null,
      });

      expect(taskRepository.save).toHaveBeenCalled();
      expect(result.sectionId).toBe(sectionId);
      expect(result.lexorank).toBe('m');
      expect(result.title).toBe('New Task');
    });

    it('should throw NotFoundException when section is not found or not owned by user', async () => {
      sectionRepository.findOne.mockResolvedValue(null);

      await expect(
        service.createTask(ownerId, {
          title: 'New Task',
          description: '',
          sectionId,
          priority: TaskPriority.HIGH,
          labels: [],
          reminders: [],
          timeRange: null,
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException on bounds or exhaustion error', async () => {
      const dbError: any = new Error('LexoRank exhausted');
      dbError.code = 'P0001';
      taskRepository.save.mockRejectedValue(dbError);

      await expect(
        service.createTask(ownerId, {
          title: 'New Task',
          description: '',
          sectionId,
          priority: TaskPriority.HIGH,
          labels: [],
          reminders: [],
          timeRange: null,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when relative reminder is provided without timeRange', async () => {
      await expect(
        service.createTask(ownerId, {
          title: 'Task with reminder but no date',
          description: '',
          sectionId,
          priority: TaskPriority.HIGH,
          labels: [],
          reminders: [
            {
              type: 'relative',
              minuteOffset: 30,
              channel: 'email',
            },
          ],
          timeRange: null,
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('updateTask', () => {
    it('should throw BadRequestException when updating task to add relative reminder without timeRange or recurrence', async () => {
      const existingTask = {
        id: 'task-1',
        title: 'Task without date',
        sectionId: 'section-1',
        section: {
          project: { ownerId: '11111111-1111-1111-1111-111111111111' },
        },
        timeRange: null,
        recurrence: null,
      };
      taskRepository.findOne.mockResolvedValue(existingTask);
      taskReminderRepository.find.mockResolvedValue([]);

      await expect(
        service.updateTask(
          'task-1',
          {
            reminders: [
              {
                type: 'relative',
                minuteOffset: 15,
                channel: 'email',
              },
            ],
          },
          '11111111-1111-1111-1111-111111111111',
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if task does not exist', async () => {
      taskRepository.findOne.mockResolvedValue(null);

      await expect(
        service.updateTask(
          'non-existent-id',
          {
            title: 'New Title',
          },
          '11111111-1111-1111-1111-111111111111',
        ),
      ).rejects.toThrow(NotFoundException);
      expect(taskRepository.save).not.toHaveBeenCalled();
    });

    it('should update task and return it with relations', async () => {
      const existingTask = {
        id: 'task-1',
        title: 'Old Title',
        completedAt: null,
        sectionId: 'section-1',
        section: {
          project: { ownerId: '11111111-1111-1111-1111-111111111111' },
        },
      };
      const savedTask = {
        ...existingTask,
        title: 'New Title',
      };
      const populatedTask = {
        ...savedTask,
        section: {
          id: 'section-1',
          name: 'Section 1',
          project: { id: 'project-1', name: 'Project 1' },
        },
        labels: [],
        recurrence: null,
      };

      taskRepository.findOne
        .mockResolvedValueOnce(existingTask)
        .mockResolvedValueOnce(populatedTask);
      taskRepository.save.mockResolvedValue(savedTask);

      const result = await service.updateTask(
        'task-1',
        {
          title: 'New Title',
        },
        '11111111-1111-1111-1111-111111111111',
      );

      expect(taskRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'New Title' }),
      );
      expect(result).toEqual(populatedTask);
    });

    it('should update task reminders with actingUserId as ownerId and delete old reminders', async () => {
      const existingTask = {
        id: 'task-1',
        title: 'Task with date',
        sectionId: 'section-1',
        section: { project: { ownerId: 'user-1' } },
        timeRange: {
          start: '2026-10-10T10:00:00.000Z',
          end: '2026-10-10T11:00:00.000Z',
        },
        recurrence: null,
      };
      const oldReminder = {
        id: 'rem-old-1',
        taskId: 'task-1',
        userId: 'user-1',
        type: 'relative',
        minuteOffset: 30,
      };

      taskRepository.findOne
        .mockResolvedValueOnce(existingTask)
        .mockResolvedValueOnce({ ...existingTask, reminders: [] });
      taskRepository.save.mockImplementation((t) => Promise.resolve(t));
      taskReminderRepository.find.mockResolvedValueOnce([oldReminder]);
      taskReminderRepository.create.mockImplementation((data) => data);
      taskReminderRepository.save.mockImplementation((data) =>
        Promise.resolve({ id: 'rem-new-1', ...data }),
      );

      await service.updateTask(
        'task-1',
        {
          reminders: [
            {
              type: 'relative',
              minuteOffset: 15,
              channel: 'email',
            },
          ],
        },
        'user-1',
      );

      expect(taskReminderRepository.delete).toHaveBeenCalledWith({
        taskId: 'task-1',
      });
      expect(taskReminderRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          taskId: 'task-1',
          userId: 'user-1',
          minuteOffset: 15,
        }),
      );
      expect(taskReminderRepository.save).toHaveBeenCalled();
      expect(taskRepository.save).toHaveBeenCalled();
    });
  });

  describe('updateTaskOrder', () => {
    const ownerId = '11111111-1111-1111-1111-111111111111';
    const taskId = '33333333-3333-3333-3333-333333333333';
    const sectionId = '22222222-2222-2222-2222-222222222222';
    const prevId = '44444444-4444-4444-4444-444444444444';

    it('should call move_task_lexorank in one DB query after checking ownership', async () => {
      taskRepository.findOne.mockResolvedValue({
        id: taskId,
        section: { projectId: 'project-1' },
      });
      dataSource.query.mockResolvedValue([{ id: taskId, lexorank: 's' }]);

      await service.updateTaskOrder({
        ownerId,
        taskId,
        sectionId,
        prevId,
      });

      expect(taskRepository.findOne).toHaveBeenCalledWith({
        where: { id: taskId },
        relations: { section: { project: true } },
      });
      expect(dataSource.query).toHaveBeenCalledTimes(1);
      const queryCall = dataSource.query.mock.calls[0];
      expect(queryCall[0]).toContain('move_task_lexorank(');
      expect(queryCall[1]).toEqual([taskId, sectionId, prevId]);
    });

    it('should throw NotFoundException if task does not exist or not owned by user', async () => {
      taskRepository.findOne.mockResolvedValue(null);

      await expect(
        service.updateTaskOrder({
          ownerId,
          taskId,
          sectionId,
          prevId: null,
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if invalid positioning is requested (22000)', async () => {
      taskRepository.findOne.mockResolvedValue({
        id: taskId,
        section: { projectId: 'project-1' },
      });
      const dbError: any = new Error(
        'A task cannot be positioned after itself',
      );
      dbError.code = '22000';
      dataSource.query.mockRejectedValue(dbError);

      await expect(
        service.updateTaskOrder({
          ownerId,
          taskId,
          sectionId,
          prevId: taskId,
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('completeTask', () => {
    const userId = 'user-uuid-1';
    const taskId = 'task-uuid-1';

    it('should complete a non-recurring task and cancel reminder', async () => {
      const mockTask: any = {
        id: taskId,
        title: 'One-off Task',
        completedAt: null,
        timeRange: {
          start: '2026-10-07T10:00:00.000Z',
          end: '2026-10-07T11:00:00.000Z',
        },
        section: { project: { ownerId: userId } },
        recurrence: null,
      };

      dataSource.transaction.mockImplementation(
        (cb: (manager: any) => Promise<any>) => {
          const manager = {
            findOne: jest.fn().mockResolvedValue(mockTask),
            create: jest.fn((_cls, val) => val),
            save: jest.fn((_cls, val) => Promise.resolve(val ?? _cls)),
          };
          return cb(manager);
        },
      );

      const result = await service.completeTaskOccurrence(userId, taskId);

      expect(result.isRecurringAdvanced).toBe(false);
      expect(result.nextDueTime).toBeNull();
      expect(mockTask.completedAt).toBeDefined();
      expect(mailerSchedulerService.cancelTaskReminder).toHaveBeenCalledWith(
        taskId,
      );
    });

    it('should advance recurring task to next occurrence and reschedule recurring reminder', async () => {
      const mockRrule: RRule = {
        freq: RecurrenceFrequency.DAILY,
        interval: 1,
      };

      const mockTask: any = {
        id: taskId,
        title: 'Daily Recurring Task',
        completedAt: null,
        timeRange: {
          start: '2026-10-07T10:00:00.000Z',
          end: '2026-10-07T11:00:00.000Z',
        },
        section: { project: { ownerId: userId } },
        recurrence: { rrule: mockRrule },
      };

      const mockUser: any = {
        id: userId,
        email: 'user@example.com',
        name: 'User',
      };

      taskReminderRepository.find.mockResolvedValueOnce([
        {
          id: 'reminder-1',
          taskId,
          type: 'relative',
          minuteOffset: 15,
          channel: 'email',
        },
      ]);

      dataSource.transaction.mockImplementation(
        (cb: (manager: any) => Promise<any>) => {
          const manager = {
            findOne: jest.fn().mockImplementation((entity) => {
              if (entity === User || entity.name === 'User')
                return Promise.resolve(mockUser);
              return Promise.resolve(mockTask);
            }),
            create: jest.fn((_cls, val) => val),
            save: jest.fn((_cls, val) => Promise.resolve(val ?? _cls)),
          };
          return cb(manager);
        },
      );

      const result = await service.completeTaskOccurrence(userId, taskId);

      expect(result.isRecurringAdvanced).toBe(true);
      expect(result.nextDueTime).toBe('2026-10-08T10:00:00.000Z');
      expect(mockTask.completedAt).toBeNull(); // Remains active!
      expect(mockTask.timeRange.start).toBe('2026-10-08T10:00:00.000Z');
      expect(
        mailerSchedulerService.scheduleRecurringTaskReminder,
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          taskId: mockTask.id,
          userId: mockUser.id,
          to: mockUser.email,
          userName: mockUser.name,
          taskTitle: mockTask.title,
          rruleString: 'FREQ=DAILY',
          reminderOffsetMinutes: 15,
        }),
      );
    });

    it('should complete recurring task when recurrence series has ended', async () => {
      const mockRrule: RRule = {
        freq: RecurrenceFrequency.DAILY,
        count: 1,
      };

      const mockTask: any = {
        id: taskId,
        title: 'Daily Task (Ended)',
        completedAt: null,
        timeRange: {
          start: '2026-10-07T10:00:00.000Z',
          end: '2026-10-07T11:00:00.000Z',
        },
        section: { project: { ownerId: userId } },
        recurrence: { rrule: mockRrule },
      };

      dataSource.transaction.mockImplementation(
        (cb: (manager: any) => Promise<any>) => {
          const manager = {
            findOne: jest.fn().mockResolvedValue(mockTask),
            create: jest.fn((_cls, val) => val),
            save: jest.fn((_cls, val) => Promise.resolve(val ?? _cls)),
          };
          return cb(manager);
        },
      );

      const result = await service.completeTaskOccurrence(userId, taskId);

      expect(result.isRecurringAdvanced).toBe(false);
      expect(result.nextDueTime).toBeNull();
      expect(mockTask.completedAt).toBeDefined();
      expect(
        mailerSchedulerService.cancelRecurringTaskReminder,
      ).toHaveBeenCalledWith(taskId);
    });

    it('should correctly advance weekly recurring task with byWeekday and no ordinal', async () => {
      const mockRrule: RRule = {
        freq: RecurrenceFrequency.WEEKLY,
        byWeekday: [{ day: Weekday.WE }, { day: Weekday.FR }],
      };

      const mockTask: any = {
        id: taskId,
        title: 'Weekly Task',
        completedAt: null,
        timeRange: {
          start: '2026-10-07T10:00:00.000Z', // Wednesday
          end: '2026-10-07T11:00:00.000Z',
        },
        section: { project: { ownerId: userId } },
        recurrence: { rrule: mockRrule },
      };

      const mockUser: any = {
        id: userId,
        email: 'user@example.com',
        name: 'User',
      };

      taskReminderRepository.find.mockResolvedValueOnce([
        {
          id: 'reminder-1',
          taskId,
          type: 'relative',
          minuteOffset: 15,
          channel: 'email',
        },
      ]);

      dataSource.transaction.mockImplementation(
        (cb: (manager: any) => Promise<any>) => {
          const manager = {
            findOne: jest.fn().mockImplementation((entity) => {
              if (entity === User || entity.name === 'User')
                return Promise.resolve(mockUser);
              return Promise.resolve(mockTask);
            }),
            create: jest.fn((_cls, val) => val),
            save: jest.fn((_cls, val) => Promise.resolve(val ?? _cls)),
          };
          return cb(manager);
        },
      );

      const result = await service.completeTaskOccurrence(userId, taskId);

      expect(result.isRecurringAdvanced).toBe(true);
      expect(result.nextDueTime).toBe('2026-10-09T10:00:00.000Z'); // Next Friday
      expect(
        mailerSchedulerService.scheduleRecurringTaskReminder,
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          rruleString: 'FREQ=WEEKLY;BYDAY=WE,FR',
        }),
      );
    });
  });

  describe('postponeTask', () => {
    it('should update timeRange and reschedule reminder', async () => {
      const userId = 'user-uuid-1';
      const taskId = 'task-uuid-1';
      const mockTask: any = {
        id: taskId,
        title: 'Postponed Task',
        completedAt: null,
        timeRange: {
          start: '2026-10-07T10:00:00.000Z',
          end: '2026-10-07T11:00:00.000Z',
        },
        section: { project: { ownerId: userId } },
        recurrence: null,
      };

      taskRepository.findOne.mockResolvedValue(mockTask);
      taskRepository.save.mockImplementation((t) => Promise.resolve(t));
      taskReminderRepository.find.mockResolvedValue([
        {
          id: 'reminder-1',
          taskId,
          type: 'relative',
          minuteOffset: 30,
          channel: 'email',
        },
      ]);
      userRepository.findOne.mockResolvedValue({
        id: userId,
        email: 'test@example.com',
        name: 'Test',
      });

      const postponeTo = new Date('2026-10-08T10:00:00.000Z');
      const updated = await service.postponeTask(userId, taskId, postponeTo);

      expect(updated.timeRange?.start).toBe(postponeTo.toISOString());
      expect(mailerSchedulerService.scheduleTaskReminder).toHaveBeenCalled();
    });
  });

  describe('uncompleteOccurrenceById', () => {
    const userId = 'user-uuid-1';
    const taskId = 'task-uuid-1';
    const occurrenceId = 'occ-uuid-1';

    it('should uncomplete a one-off task occurrence and reset completedAt', async () => {
      const mockTask: any = {
        id: taskId,
        title: 'One-off Task',
        completedAt: new Date('2026-10-08T10:00:00.000Z'),
        timeRange: {
          start: '2026-10-08T10:00:00.000Z',
          end: '2026-10-08T11:00:00.000Z',
        },
        section: { project: { ownerId: userId } },
        recurrence: null,
      };

      const mockOccurrence: any = {
        id: occurrenceId,
        taskId,
        userId,
        status: 'completed',
        completedAt: new Date('2026-10-08T10:00:00.000Z'),
        task: mockTask,
      };

      dataSource.transaction.mockImplementation(
        (cb: (manager: any) => Promise<any>) => {
          const manager = {
            findOne: jest.fn().mockImplementation((entity) => {
              if (entity === TaskOccurrence)
                return Promise.resolve(mockOccurrence);
              return Promise.resolve(mockTask);
            }),
            remove: jest.fn().mockResolvedValue(mockOccurrence),
            save: jest
              .fn()
              .mockImplementation((_cls, val) => Promise.resolve(val ?? _cls)),
          };
          return cb(manager);
        },
      );

      const result = await service.uncompleteOccurrenceById(
        userId,
        occurrenceId,
      );

      expect(result.completedAt).toBeNull();
    });

    it('should throw ConflictException when trying to uncomplete non-latest occurrence of recurring task', async () => {
      const mockTask: any = {
        id: taskId,
        title: 'Recurring Task',
        completedAt: null,
        timeRange: {
          start: '2026-10-09T10:00:00.000Z',
          end: '2026-10-09T11:00:00.000Z',
        },
        section: { project: { ownerId: userId } },
        recurrence: { rrule: { freq: 3 } },
      };

      const olderOccurrence: any = {
        id: occurrenceId,
        taskId,
        userId,
        status: 'completed',
        scheduledDate: new Date('2026-10-07T10:00:00.000Z'),
        completedAt: new Date('2026-10-07T10:05:00.000Z'),
        task: mockTask,
      };

      const latestOccurrence: any = {
        id: 'newer-occ-uuid',
        taskId,
        userId,
        status: 'completed',
        scheduledDate: new Date('2026-10-08T10:00:00.000Z'),
        completedAt: new Date('2026-10-08T10:05:00.000Z'),
      };

      dataSource.transaction.mockImplementation(
        (cb: (manager: any) => Promise<any>) => {
          const manager = {
            findOne: jest.fn().mockImplementation((entity, opts) => {
              if (
                entity === TaskOccurrence &&
                opts?.where?.id === occurrenceId
              ) {
                return Promise.resolve(olderOccurrence);
              }
              if (
                entity === TaskOccurrence &&
                opts?.order?.completedAt === 'DESC'
              ) {
                return Promise.resolve(latestOccurrence);
              }
              return Promise.resolve(mockTask);
            }),
            remove: jest.fn(),
            save: jest.fn(),
          };
          return cb(manager);
        },
      );

      await expect(
        service.uncompleteOccurrenceById(userId, occurrenceId),
      ).rejects.toThrow(ConflictException);
    });

    it('should throw ForbiddenException if user is not the owner', async () => {
      const mockTask: any = {
        id: taskId,
        section: { project: { ownerId: 'other-user' } },
      };

      const mockOccurrence: any = {
        id: occurrenceId,
        userId: 'other-user',
        task: mockTask,
      };

      dataSource.transaction.mockImplementation(
        (cb: (manager: any) => Promise<any>) => {
          const manager = {
            findOne: jest.fn().mockResolvedValue(mockOccurrence),
          };
          return cb(manager);
        },
      );

      await expect(
        service.uncompleteOccurrenceById(userId, occurrenceId),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('deleteOccurrenceById', () => {
    const userId = 'user-uuid-1';
    const occurrenceId = 'occ-uuid-1';

    it('should delete occurrence when authorized', async () => {
      const mockOccurrence: any = {
        id: occurrenceId,
        userId,
        task: {
          section: { project: { ownerId: userId } },
        },
      };

      taskOccurrenceRepository.findOne.mockResolvedValue(mockOccurrence);
      taskOccurrenceRepository.delete.mockResolvedValue({ affected: 1 });

      const result = await service.deleteOccurrenceById(userId, occurrenceId);
      expect(result).toBe(true);
      expect(taskOccurrenceRepository.delete).toHaveBeenCalledWith(
        occurrenceId,
      );
    });

    it('should throw NotFoundException if occurrence does not exist', async () => {
      taskOccurrenceRepository.findOne.mockResolvedValue(null);

      await expect(
        service.deleteOccurrenceById(userId, occurrenceId),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if user does not own occurrence or project', async () => {
      const mockOccurrence: any = {
        id: occurrenceId,
        userId: 'other-user',
        task: {
          section: { project: { ownerId: 'other-user' } },
        },
      };

      taskOccurrenceRepository.findOne.mockResolvedValue(mockOccurrence);

      await expect(
        service.deleteOccurrenceById(userId, occurrenceId),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('deleteTask', () => {
    const actingUserId = 'user-uuid-1';
    const taskId = 'task-uuid-1';

    it('should delete task and cancel reminders when authorized', async () => {
      taskRepository.findOne.mockResolvedValue({
        id: taskId,
        section: { projectId: 'proj-1' },
        reminders: [{ id: 'rem-1' }],
      });
      taskRepository.delete.mockResolvedValue({ affected: 1 });

      await service.deleteTask(taskId, actingUserId);

      expect(projectAccessService.assertCan).toHaveBeenCalledWith(
        actingUserId,
        'proj-1',
        'task:delete',
      );
      expect(taskRepository.delete).toHaveBeenCalledWith(taskId);
      expect(mailerSchedulerService.cancelTaskReminder).toHaveBeenCalledWith(
        'rem-1',
      );
    });

    it('should throw NotFoundException if task does not exist', async () => {
      taskRepository.findOne.mockResolvedValue(null);

      await expect(service.deleteTask(taskId, actingUserId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw NotFoundException (concealing existence) when user is not a project member', async () => {
      taskRepository.findOne.mockResolvedValue({
        id: taskId,
        section: { projectId: 'proj-1' },
      });
      projectAccessService.assertCan.mockRejectedValue(
        new NotFoundException('Project not found'),
      );

      await expect(service.deleteTask(taskId, actingUserId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ForbiddenException when user has insufficient role (e.g. viewer)', async () => {
      taskRepository.findOne.mockResolvedValue({
        id: taskId,
        section: { projectId: 'proj-1' },
      });
      projectAccessService.assertCan.mockRejectedValue(
        new ForbiddenException(
          'Insufficient permissions for action: task:delete',
        ),
      );

      await expect(service.deleteTask(taskId, actingUserId)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('collaborator task operations', () => {
    it('should allow editor to postpone task in shared project', async () => {
      const editorId = 'editor-user-id';
      const taskId = 'task-uuid-1';
      const mockTask: any = {
        id: taskId,
        title: 'Collaborative Task',
        completedAt: null,
        timeRange: {
          start: '2026-10-07T10:00:00.000Z',
          end: '2026-10-07T11:00:00.000Z',
        },
        section: { projectId: 'shared-proj-1' },
        recurrence: null,
      };

      taskRepository.findOne.mockResolvedValue(mockTask);
      taskRepository.save.mockImplementation((t) => Promise.resolve(t));
      taskReminderRepository.find.mockResolvedValue([]);
      userRepository.findOne.mockResolvedValue({
        id: editorId,
        email: 'editor@example.com',
      });

      const postponeTo = new Date('2026-10-09T10:00:00.000Z');
      const result = await service.postponeTask(editorId, taskId, postponeTo);

      expect(projectAccessService.assertCan).toHaveBeenCalledWith(
        editorId,
        'shared-proj-1',
        'task:update',
      );
      expect(result.timeRange?.start).toBe(postponeTo.toISOString());
    });

    it('should check task:move on both source and target projects when moving tasks across projects', async () => {
      const editorId = 'editor-user-id';
      const taskId = 'task-uuid-1';
      const mockTask: any = {
        id: taskId,
        sectionId: 'sec-source',
        section: { projectId: 'proj-source' },
      };

      taskRepository.findOne
        .mockResolvedValueOnce(mockTask)
        .mockResolvedValueOnce({ ...mockTask, sectionId: 'sec-target' });
      taskRepository.save.mockResolvedValue({
        ...mockTask,
        sectionId: 'sec-target',
      });
      sectionRepository.findOne.mockResolvedValue({
        id: 'sec-target',
        projectId: 'proj-target',
      });

      await service.updateTask(taskId, { sectionId: 'sec-target' }, editorId);

      expect(projectAccessService.assertCan).toHaveBeenCalledWith(
        editorId,
        'proj-source',
        'task:update',
      );
      expect(projectAccessService.assertCan).toHaveBeenCalledWith(
        editorId,
        'proj-source',
        'task:move',
      );
      expect(projectAccessService.assertCan).toHaveBeenCalledWith(
        editorId,
        'proj-target',
        'task:move',
      );
    });
  });
});
