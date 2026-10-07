import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { BadRequestException } from '@nestjs/common';
import { ProductivityService } from './productivity.service';
import { TaskOccurrence } from '../tasks/entities/task-occurrence.entity';
import { UserGoal } from '../users/entities/user-goal.entity';

describe('ProductivityService', () => {
  let service: ProductivityService;
  let mockTaskOccurrenceRepo: any;
  let mockUserGoalRepo: any;
  let mockDataSource: any;

  const mockQueryBuilder = {
    innerJoin: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    getCount: jest.fn(),
  };

  beforeEach(async () => {
    mockTaskOccurrenceRepo = {
      createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
    };

    mockUserGoalRepo = {
      findOne: jest.fn(),
      find: jest.fn(),
      create: jest.fn((dto) => ({ id: 'goal-uuid', ...dto })),
      save: jest.fn((entity) =>
        Promise.resolve({ id: 'goal-uuid', ...entity }),
      ),
    };

    mockDataSource = {
      transaction: jest.fn(async (cb) => {
        const manager = {
          save: jest.fn((_entity, val) => Promise.resolve(val)),
          create: jest.fn((_entity, val) => ({ id: 'new-goal-uuid', ...val })),
        };
        return cb(manager);
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductivityService,
        {
          provide: getRepositoryToken(TaskOccurrence),
          useValue: mockTaskOccurrenceRepo,
        },
        {
          provide: getRepositoryToken(UserGoal),
          useValue: mockUserGoalRepo,
        },
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
      ],
    }).compile();

    service = module.get<ProductivityService>(ProductivityService);
  });

  describe('parseUserTimezone error handling', () => {
    it('throws BadRequestException on invalid timezone', async () => {
      await expect(
        service.getGoalProgress('user-1', 'Invalid/Timezone_Name'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getGoalProgress', () => {
    it('calculates progress and achieved state against user goals', async () => {
      mockUserGoalRepo.findOne.mockResolvedValue({
        id: 'g-1',
        userId: 'user-1',
        dailyGoal: 5,
        weeklyGoal: 20,
        effectiveFrom: new Date(),
        effectiveTo: null,
      });

      // 1st getCount for daily (3), 2nd for weekly (22)
      mockQueryBuilder.getCount
        .mockResolvedValueOnce(3)
        .mockResolvedValueOnce(22);

      const result = await service.getGoalProgress('user-1', 'UTC');

      expect(result).toEqual({
        daily: {
          completed: 3,
          target: 5,
          isAchieved: false,
          percentage: 0.6,
        },
        weekly: {
          completed: 22,
          target: 20,
          isAchieved: true,
          percentage: 1.1,
        },
      });
    });

    it('creates default goal (5 daily, 20 weekly) if none exists', async () => {
      mockUserGoalRepo.findOne.mockResolvedValue(null);
      mockQueryBuilder.getCount.mockResolvedValue(0);

      const result = await service.getGoalProgress('user-1', 'UTC');

      expect(mockUserGoalRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-1',
          dailyGoal: 5,
          weeklyGoal: 20,
          effectiveTo: null,
        }),
      );
      expect(result.daily.target).toBe(5);
      expect(result.weekly.target).toBe(20);
    });
  });

  describe('updateGoals', () => {
    it('versions user goals by closing old version and creating new version', async () => {
      const activeGoal = {
        id: 'g-old',
        userId: 'user-1',
        dailyGoal: 5,
        weeklyGoal: 20,
        effectiveFrom: new Date('2026-01-01'),
        effectiveTo: null,
      };
      mockUserGoalRepo.findOne.mockResolvedValue(activeGoal);

      const updated = await service.updateGoals('user-1', {
        dailyGoal: 8,
        weeklyGoal: 30,
      });

      expect(mockDataSource.transaction).toHaveBeenCalled();
      expect(activeGoal.effectiveTo).toBeInstanceOf(Date);
      expect(updated.dailyGoal).toBe(8);
      expect(updated.weeklyGoal).toBe(30);
    });

    it('returns existing goal unchanged if target values are the same', async () => {
      const activeGoal = {
        id: 'g-same',
        userId: 'user-1',
        dailyGoal: 5,
        weeklyGoal: 20,
        effectiveFrom: new Date('2026-01-01'),
        effectiveTo: null,
      };
      mockUserGoalRepo.findOne.mockResolvedValue(activeGoal);

      const result = await service.updateGoals('user-1', {
        dailyGoal: 5,
        weeklyGoal: 20,
      });

      expect(mockDataSource.transaction).not.toHaveBeenCalled();
      expect(result).toBe(activeGoal);
    });
  });

  describe('getGoalHistory', () => {
    it('evaluates past days with historical goal versioning', async () => {
      // Version 1: daily goal 4 from 2026-09-01 to 2026-10-05
      // Version 2: daily goal 10 from 2026-10-05 onwards
      mockUserGoalRepo.find.mockResolvedValue([
        {
          id: 'v1',
          userId: 'user-1',
          dailyGoal: 4,
          weeklyGoal: 20,
          effectiveFrom: new Date('2026-09-01'),
          effectiveTo: new Date('2026-10-05T00:00:00Z'),
        },
        {
          id: 'v2',
          userId: 'user-1',
          dailyGoal: 10,
          weeklyGoal: 30,
          effectiveFrom: new Date('2026-10-05T00:00:00Z'),
          effectiveTo: null,
        },
      ]);

      mockQueryBuilder.getCount.mockResolvedValue(4);

      const history = await service.getGoalHistory('user-1', 'UTC', 3);
      expect(history.length).toBe(3);
      expect(history[0]).toHaveProperty('date');
      expect(history[0]).toHaveProperty('dayName');
      expect(history[0]).toHaveProperty('completed');
      expect(history[0]).toHaveProperty('target');
      expect(history[0]).toHaveProperty('isAchieved');
    });
  });
});
