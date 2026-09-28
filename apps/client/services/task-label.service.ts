import { apiClient } from "@/lib/api-client";
import type {
  CreateTaskLabelDto,
  UpdateTaskLabelDto,
  TaskLabelResponseDto as TaskLabel
} from "@todo/shared";

export const taskLabelService = {
  createTaskLabel: async (createTaskLabelDto: CreateTaskLabelDto) => {
    return apiClient.post<TaskLabel>("/task-labels", createTaskLabelDto);
  },

  getMyTaskLabels: async () => {
    const response = await apiClient.get<TaskLabel[]>("/task-labels/me");
    return response.data;
  },

  getTaskLabelById: async (id: string) => {
  },
  updateTaskLabel: async (updateTaskLabelDto: UpdateTaskLabelDto) => {
    return apiClient.patch<TaskLabel>(`/task-labels/${updateTaskLabelDto.id}`, updateTaskLabelDto);
  },
  deleteTaskLabel: async (id: string) => {
  },
};