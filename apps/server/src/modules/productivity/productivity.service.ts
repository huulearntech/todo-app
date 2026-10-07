import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, IsNull, Repository } from 'typeorm';
import { DateTime } from 'luxon';

import { Task } from '../tasks/entities/task.entity';
import { TaskOccurrence } from '../tasks/entities/task-occurrence.entity';
import { UserGoal } from '../users/entities/user-goal.entity';
import { UpdateUserGoalDto } from './dto/update-user-goal.dto';
import {
  type GoalProgressResponseDto,
  TaskOccurrenceStatus,
} from '@todo/shared';

export interface DayGoalHistoryItem {
  date: string;
  dayName: string;
  completed: number;
  target: number;
  isAchieved: boolean;
}

@Injectable()
export class ProductivityService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(TaskOccurrence)
    private readonly taskOccurrenceRepository: Repository<TaskOccurrence>,
    @InjectRepository(UserGoal)
    private readonly userGoalRepository: Repository<UserGoal>,
  ) {}

  private parseUserTimezone(timezone?: string): DateTime {
    const tz = timezone || 'UTC';
    const now = DateTime.now().setZone(tz);
    if (!now.isValid) {
      throw new BadRequestException(
        `Invalid timezone: "${tz}". ${now.invalidExplanation || ''}`,
      );
    }
    return now;
  }

  async getActiveUserGoal(userId: string): Promise<UserGoal> {
    let goal = await this.userGoalRepository.findOne({
      where: { userId, effectiveTo: IsNull() },
      order: { effectiveFrom: 'DESC' },
    });

    if (!goal) {
      goal = this.userGoalRepository.create({
        userId,
        dailyGoal: 5,
        weeklyGoal: 20,
        effectiveFrom: new Date(),
        effectiveTo: null,
      });
      goal = await this.userGoalRepository.save(goal);
    }

    return goal;
  }

  async getGoalProgress(
    userId: string,
    timezone?: string,
  ): Promise<GoalProgressResponseDto> {
    const nowInUserTz = this.parseUserTimezone(timezone);

    const startOfDay = nowInUserTz.startOf('day').toJSDate();
    const endOfDay = nowInUserTz.endOf('day').toJSDate();

    const startOfWeek = nowInUserTz.startOf('week').toJSDate();
    const endOfWeek = nowInUserTz.endOf('week').toJSDate();

    const [completedToday, completedThisWeek, activeGoal] = await Promise.all([
      this.taskOccurrenceRepository
        .createQueryBuilder('to')
        .where('to.userId = :userId', { userId })
        .andWhere('to.status = :status', {
          status: TaskOccurrenceStatus.COMPLETED,
        })
        .andWhere(
          'to.completedAt >= :startOfDay AND to.completedAt <= :endOfDay',
          {
            startOfDay,
            endOfDay,
          },
        )
        .getCount(),

      this.taskOccurrenceRepository
        .createQueryBuilder('to')
        .where('to.userId = :userId', { userId })
        .andWhere('to.status = :status', {
          status: TaskOccurrenceStatus.COMPLETED,
        })
        .andWhere(
          'to.completedAt >= :startOfWeek AND to.completedAt <= :endOfWeek',
          {
            startOfWeek,
            endOfWeek,
          },
        )
        .getCount(),

      this.getActiveUserGoal(userId),
    ]);

    const dailyTarget = activeGoal.dailyGoal;
    const weeklyTarget = activeGoal.weeklyGoal;

    return {
      daily: {
        completed: completedToday,
        target: dailyTarget,
        isAchieved: completedToday >= dailyTarget,
        percentage:
          dailyTarget > 0
            ? Math.round((completedToday / dailyTarget) * 100) / 100
            : 0,
      },
      weekly: {
        completed: completedThisWeek,
        target: weeklyTarget,
        isAchieved: completedThisWeek >= weeklyTarget,
        percentage:
          weeklyTarget > 0
            ? Math.round((completedThisWeek / weeklyTarget) * 100) / 100
            : 0,
      },
    };
  }

  async updateGoals(
    userId: string,
    updateDto: UpdateUserGoalDto,
  ): Promise<UserGoal> {
    const currentGoal = await this.getActiveUserGoal(userId);

    const newDailyGoal = updateDto.dailyGoal ?? currentGoal.dailyGoal;
    const newWeeklyGoal = updateDto.weeklyGoal ?? currentGoal.weeklyGoal;

    if (
      newDailyGoal === currentGoal.dailyGoal &&
      newWeeklyGoal === currentGoal.weeklyGoal
    ) {
      return currentGoal;
    }

    return this.dataSource.transaction(async (manager) => {
      const now = new Date();

      // Close current active goal
      currentGoal.effectiveTo = now;
      await manager.save(UserGoal, currentGoal);

      // Create new active goal version
      const newGoal = manager.create(UserGoal, {
        userId,
        dailyGoal: newDailyGoal,
        weeklyGoal: newWeeklyGoal,
        effectiveFrom: now,
        effectiveTo: null,
      });

      return manager.save(UserGoal, newGoal);
    });
  }

  async getGoalHistory(
    userId: string,
    timezone?: string,
    days = 7,
  ): Promise<DayGoalHistoryItem[]> {
    const nowInUserTz = this.parseUserTimezone(timezone);
    const historyList: DayGoalHistoryItem[] = [];

    // Pre-fetch all goal history versions for this user
    const userGoals = await this.userGoalRepository.find({
      where: { userId },
      order: { effectiveFrom: 'ASC' },
    });

    for (let i = days; i >= 1; i--) {
      const dayDate = nowInUserTz.minus({ days: i });
      const dayStart = dayDate.startOf('day').toJSDate();
      const dayEnd = dayDate.endOf('day').toJSDate();
      const dateString = dayDate.toFormat('yyyy-MM-dd');
      const dayName = dayDate.toFormat('ccc');

      const completedCount = await this.taskOccurrenceRepository
        .createQueryBuilder('to')
        .where('to.userId = :userId', { userId })
        .andWhere('to.status = :status', {
          status: TaskOccurrenceStatus.COMPLETED,
        })
        .andWhere('to.completedAt >= :dayStart AND to.completedAt <= :dayEnd', {
          dayStart,
          dayEnd,
        })
        .getCount();

      // Match the goal that was active during this day
      const matchedGoal =
        userGoals.find((g) => {
          const fromOk = g.effectiveFrom <= dayEnd;
          const toOk = !g.effectiveTo || g.effectiveTo >= dayStart;
          return fromOk && toOk;
        }) || userGoals[userGoals.length - 1];

      const target = matchedGoal?.dailyGoal ?? 5;

      historyList.push({
        date: dateString,
        dayName,
        completed: completedCount,
        target,
        isAchieved: completedCount >= target,
      });
    }

    return historyList;
  }
}
