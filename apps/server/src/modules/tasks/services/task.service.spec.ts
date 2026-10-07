import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { TaskService } from './task.service';
import { Task } from '../entities/task.entity';
import { TaskOccurrence } from '../entities/task-occurrence.entity';
import { Section } from '@/src/modules/sections/section.entity';
import {
  RecurrenceFrequency,
  TaskPriority,
  Weekday,
  type RRule,
} from '@todo/shared';

import { User } from '@/src/modules/users/user.entity';
import { MailerSchedulerService } from '@/src/modules/mailer/services/mailer-scheduler.service';

describe('TaskService', () => {
  let service: TaskService;
  let dataSource: { query: jest.Mock; transaction: jest.Mock };
  let taskRepository: {
    find: jest.Mock;
    findOne: jest.Mock;
    save: jest.Mock;
    delete: jest.Mock;
  };
  let sectionRepository: { exists: jest.Mock };
  let userRepository: { findOne: jest.Mock };
  let mailerSchedulerService: {
    scheduleTaskReminder: jest.Mock;
    cancelTaskReminder: jest.Mock;
    scheduleRecurringTaskReminder: jest.Mock;
    cancelRecurringTaskReminder: jest.Mock;
  };

  beforeEach(async () => {
    dataSource = {
      query: jest.fn(),
      transaction: jest.fn(),
    };
    taskRepository = {
      find: jest.fn(),
      findOne: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
    };
    sectionRepository = {
      exists: jest.fn(),
    };
    userRepository = {
      findOne: jest.fn().mockResolvedValue(null),
    };
    mailerSchedulerService = {
      scheduleTaskReminder: jest.fn().mockResolvedValue(undefined),
      cancelTaskReminder: jest.fn().mockResolvedValue(undefined),
      scheduleRecurringTaskReminder: jest.fn().mockResolvedValue(undefined),
      cancelRecurringTaskReminder: jest.fn().mockResolvedValue(undefined),
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
          useValue: {
            create: jest.fn().mockImplementation((dto) => dto),
            save: jest
              .fn()
              .mockImplementation((entity) => Promise.resolve(entity)),
            findOne: jest.fn(),
            remove: jest.fn(),
          },
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
          provide: MailerSchedulerService,
          useValue: mailerSchedulerService,
        },
      ],
    }).compile();

    service = module.get<TaskService>(TaskService);
  });

  describe('createTask', () => {
    const ownerId = '11111111-1111-1111-1111-111111111111';
    const sectionId = '22222222-2222-2222-2222-222222222222';

    it('should call create_task and return the created task row mapped to entity structure', async () => {
      const mockRawRow = {
        id: '33333333-3333-3333-3333-333333333333',
        title: 'New Task',
        description: 'Task description',
        priority: 'high',
        section_id: sectionId,
        lexorank: 'm',
        created_at: new Date('2026-10-02T10:00:00.000Z'),
        updated_at: new Date('2026-10-02T10:00:00.000Z'),
        completed_at: null,
      };

      dataSource.query.mockResolvedValue([mockRawRow]);

      const result = await service.createTask(ownerId, {
        title: 'New Task',
        sectionId,
        description: 'Task description',
        priority: TaskPriority.HIGH,
        labels: [],
        timeRange: null,
      });

      expect(dataSource.query).toHaveBeenCalledTimes(1);
      const queryCall = dataSource.query.mock.calls[0];
      expect(queryCall[0]).toContain('create_task(');
      expect(queryCall[1][0]).toBe(ownerId);
      expect(queryCall[1][2]).toBe(sectionId);
      expect(queryCall[1][3]).toBe('New Task');
      expect(queryCall[1][4]).toBe('Task description');
      expect(queryCall[1][5]).toBe(TaskPriority.HIGH);

      expect(result.id).toBe(mockRawRow.id);
      expect(result.sectionId).toBe(sectionId);
      expect(result.lexorank).toBe('m');
      expect(result.title).toBe('New Task');
    });

    it('should throw NotFoundException when section is not found or not owned by user (P0002)', async () => {
      const dbError: any = new Error(
        'Section does not exist or does not belong to the user',
      );
      dbError.code = 'P0002';
      dataSource.query.mockRejectedValue(dbError);

      await expect(
        service.createTask(ownerId, {
          title: 'New Task',
          sectionId,
          priority: TaskPriority.HIGH,
          labels: [],
          timeRange: null,
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException on bounds or exhaustion error', async () => {
      const dbError: any = new Error('LexoRank exhausted');
      dbError.code = 'P0001';
      dataSource.query.mockRejectedValue(dbError);

      await expect(
        service.createTask(ownerId, {
          title: 'New Task',
          sectionId,
          priority: TaskPriority.HIGH,
          labels: [],
          timeRange: null,
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('updateTask', () => {
    it('should return null if task does not exist', async () => {
      taskRepository.findOne.mockResolvedValue(null);

      const result = await service.updateTask('non-existent-id', {
        title: 'New Title',
      });

      expect(result).toBeNull();
      expect(taskRepository.save).not.toHaveBeenCalled();
    });

    it('should update task and return it with relations', async () => {
      const existingTask = {
        id: 'task-1',
        title: 'Old Title',
        completedAt: null,
        sectionId: 'section-1',
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

      const result = await service.updateTask('task-1', {
        title: 'New Title',
      });

      expect(taskRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'New Title' }),
      );
      expect(taskRepository.findOne).toHaveBeenLastCalledWith({
        where: { id: 'task-1' },
        relations: {
          section: {
            project: true,
          },
          labels: true,
          recurrence: true,
        },
      });
      expect(result).toEqual(populatedTask);
    });
  });

  describe('updateTaskOrder', () => {
    const ownerId = '11111111-1111-1111-1111-111111111111';
    const taskId = '33333333-3333-3333-3333-333333333333';
    const sectionId = '22222222-2222-2222-2222-222222222222';
    const prevId = '44444444-4444-4444-4444-444444444444';

    it('should call move_task in one DB query', async () => {
      dataSource.query.mockResolvedValue([{ id: taskId, lexorank: 's' }]);

      await service.updateTaskOrder({
        ownerId,
        taskId,
        sectionId,
        prevId,
      });

      expect(dataSource.query).toHaveBeenCalledTimes(1);
      const queryCall = dataSource.query.mock.calls[0];
      expect(queryCall[0]).toContain('move_task(');
      expect(queryCall[1]).toEqual([ownerId, taskId, sectionId, prevId]);
    });

    it('should throw NotFoundException if task or section does not exist (P0002)', async () => {
      const dbError: any = new Error(
        'Task does not exist or does not belong to the user',
      );
      dbError.code = 'P0002';
      dataSource.query.mockRejectedValue(dbError);

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

      const result = await service.completeTask(userId, taskId);

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

      const result = await service.completeTask(userId, taskId);

      expect(result.isRecurringAdvanced).toBe(true);
      expect(result.nextDueTime).toBe('2026-10-08T10:00:00.000Z');
      expect(mockTask.completedAt).toBeNull(); // Remains active!
      expect(mockTask.timeRange.start).toBe('2026-10-08T10:00:00.000Z');
      expect(
        mailerSchedulerService.scheduleRecurringTaskReminder,
      ).toHaveBeenCalledWith({
        taskId: mockTask.id,
        userId: mockUser.id,
        to: mockUser.email,
        userName: mockUser.name,
        taskTitle: mockTask.title,
        rruleString: 'FREQ=DAILY',
        reminderOffsetMinutes: 15,
      });
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

      const result = await service.completeTask(userId, taskId);

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

      const result = await service.completeTask(userId, taskId);

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
});
