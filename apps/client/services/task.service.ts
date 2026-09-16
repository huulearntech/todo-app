import { apiClient } from "@/lib/api-client";
import { Task } from "@/types/task.type";

import type { TaskFilterDto, CreateTaskDto } from "@todo/shared";


export const taskService = {
  async createTask(createTaskDto: CreateTaskDto) {
    const response = await apiClient.post<Task>("/tasks", createTaskDto);
    console.log("createTask response:", response.data);
    return response.data;
  },

  async getAllTasks() {
    const response = await apiClient.get<Task[]>("/tasks");
    return response.data;
  },

  async getMyTasks(filter?: TaskFilterDto) {
    const response = await apiClient.get<Task[]>("/tasks/me", {
      params: filter,
    });
    return response.data;
  },

  async deleteTask(id: string) {
    const response = await apiClient.delete(`/tasks/${id}`);
    return response.data;
  },

  async updateTaskOrder(id: string, prevId?: string, nextId?: string) {
    await apiClient.patch(`/tasks/${id}/reorder`, {
      prevId,
      nextId,
    });
  }
};