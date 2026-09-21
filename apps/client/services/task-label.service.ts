import { apiClient } from "@/lib/api-client";
import { TaskLabel } from "@/types/task-label.type";

import { CreateTaskLabelDto, UpdateTaskLabelDto } from "@todo/shared";

export const taskLabelService = {
  createTaskLabel: async (createTaskLabelDto: CreateTaskLabelDto) => {
    return apiClient.post<TaskLabel>("/task-labels", createTaskLabelDto);
  },

  getMyTaskLabels: async () => {
    return apiClient.get<TaskLabel[]>("/task-labels/me");
  },

  getTaskLabelById: async (id: string) => {
  },
  updateTaskLabel: async (updateTaskLabelDto: UpdateTaskLabelDto) => {
    return apiClient.patch<TaskLabel>(`/task-labels/${updateTaskLabelDto.id}`, updateTaskLabelDto);
  },
  deleteTaskLabel: async (id: string) => {
  },
};