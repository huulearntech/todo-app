import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { TaskService } from './task.service';
import { Task } from '../entities/task.entity';
import { Section } from '@/src/modules/sections/section.entity';
import { TaskPriority } from '@todo/shared';

import { User } from '@/src/modules/users/user.entity';
import { MailerSchedulerService } from '@/src/modules/mailer/services/mailer-scheduler.service';

describe('TaskService', () => {
  let service: TaskService;
  let dataSource: { query: jest.Mock };
  let taskRepository: {
    find: jest.Mock;
    findOne: jest.Mock;
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
    };
    taskRepository = {
      find: jest.fn(),
      findOne: jest.fn(),
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
});
