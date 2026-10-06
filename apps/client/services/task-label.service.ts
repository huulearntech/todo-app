import { apiClient } from "@/lib/api-client";
import type {
  CreateTaskLabelDto,
  UpdateTaskLabelDto,
  TaskLabelResponseDto,
} from "@todo/shared";

export const taskLabelService = {
  createTaskLabel: async (createTaskLabelDto: CreateTaskLabelDto) => {
    return apiClient.post<TaskLabelResponseDto>("/task-labels", createTaskLabelDto);
  },

  getMyTaskLabels: async () => {
    const response = await apiClient.get<TaskLabelResponseDto[]>("/task-labels/me");
    return response.data;
  },

  getTaskLabelById: async (id: string) => {
  },
  updateTaskLabel: async (updateTaskLabelDto: UpdateTaskLabelDto) => {
    return apiClient.patch<TaskLabelResponseDto>(`/task-labels/${updateTaskLabelDto.id}`, updateTaskLabelDto);
  },

  deleteTaskLabel: async (id: string) => {
    const response = await apiClient.delete<boolean>(`/task-labels/${id}`)
    return response.data;
  },
};