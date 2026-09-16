import { apiClient } from "@/lib/api-client";
import { TaskLabel } from "@/types/task-label.type";

export type CreateTaskLabelDto = {
  name: string;
  description?: string;
};

export const taskLabelService = {
  createTaskLabel: async (createTaskLabelDto: CreateTaskLabelDto) => {
    return apiClient.post<TaskLabel>("/task-labels", createTaskLabelDto);
  },

  getMyTaskLabels: async () => {
    return apiClient.get<TaskLabel[]>("/task-labels/me");
  },

  getTaskLabelById: async (id: string) => {
  },
  updateTaskLabel: async (id: string, name: string, description?: string) => {
  },
  deleteTaskLabel: async (id: string) => {
  },
};