import { apiClient } from "@/lib/api-client";
import type {
  GoalProgressResponseDto,
  UpdateUserGoalDto,
  UserGoalDto,
} from "@todo/shared";

export interface DayGoalHistoryItem {
  date: string;
  dayName: string;
  completed: number;
  target: number;
  isAchieved: boolean;
}

export const productivityService = {
  async getGoalProgress(): Promise<GoalProgressResponseDto> {
    const response = await apiClient.get<GoalProgressResponseDto>(
      "/productivity/goals",
    );
    return response.data;
  },

  async updateGoals(dto: UpdateUserGoalDto): Promise<UserGoalDto> {
    const response = await apiClient.patch<UserGoalDto>(
      "/productivity/goals",
      dto,
    );
    return response.data;
  },

  async getGoalHistory(days = 7): Promise<DayGoalHistoryItem[]> {
    const response = await apiClient.get<DayGoalHistoryItem[]>(
      "/productivity/history",
      {
        params: { days },
      },
    );
    return response.data;
  },
};
