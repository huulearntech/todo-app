import { z } from "zod";

export const updateUserGoalSchema = z.object({
  dailyGoal: z.number().int().min(1).max(100).optional(),
  weeklyGoal: z.number().int().min(1).max(500).optional(),
});

export type UpdateUserGoalDto = z.infer<typeof updateUserGoalSchema>;

export const userGoalSchema = z.object({
  id: z.uuid(),
  userId: z.uuid(),
  dailyGoal: z.number().int(),
  weeklyGoal: z.number().int(),
  effectiveFrom: z.date(),
  effectiveTo: z.date().nullable(),
});

export type UserGoalDto = z.infer<typeof userGoalSchema>;

export const goalPeriodProgressSchema = z.object({
  completed: z.number().int(),
  target: z.number().int(),
  isAchieved: z.boolean(),
  percentage: z.number(),
});

export type GoalPeriodProgressDto = z.infer<typeof goalPeriodProgressSchema>;

export const goalProgressResponseSchema = z.object({
  daily: goalPeriodProgressSchema,
  weekly: goalPeriodProgressSchema,
});

export type GoalProgressResponseDto = z.infer<typeof goalProgressResponseSchema>;
