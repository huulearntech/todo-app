import { apiClient } from "@/lib/api-client";
import { Task } from "@/types/task.type";

// TODO: may rename?
import type { CreateTaskOutput, UpdateTaskOutput } from "@todo/shared/browser";
import type { TaskFilterDto } from "@todo/shared";


export const taskService = {
  async createTask(createTaskDto: CreateTaskOutput) {
    const response = await apiClient.post<Task>("/tasks", createTaskDto);
    console.log("createTask response:", response.data);
    return response.data;
  },

  async getAllTasks() {
    const response = await apiClient.get<Task[]>("/tasks");
    return response.data;
  },

  async getMyTasks(filter?: TaskFilterDto) {
    console.log(filter)
    const response = await apiClient.get<Task[]>("/tasks/me", {
      params: filter,
      paramsSerializer: { // TODO: @Cleanup @Temporary
        indexes: null,
      }
    });
    return response.data;
  },

  async getTasksByProjectId(projectId: string, filter?: Omit<TaskFilterDto, "projectId">) {
    const response = await apiClient.get<Task[]>(`/projects/${projectId}/tasks`, {
      params: filter,
    });
    return response.data;
  },

  async getMyTasksDueToday() {
    const response = await apiClient.get<Task[]>("/tasks/me/due-today", {
      headers: {
        "x-timezone": Intl.DateTimeFormat().resolvedOptions().timeZone, // Send the user's timezone to the server 
      },
    });
    return response.data;
  },

  // TODO: @Cleanup @Temporary
  async getMyTasksByLabelId(labelId: string) {
    const response = await apiClient.get<Task[]>(`/tasks/tempbylabel/${labelId}`);
    return response.data;
  },

  async updateTask(taskId: string, updateTaskDto: UpdateTaskOutput) {
    const response = await apiClient.patch<Task>(`/tasks/${taskId}`, updateTaskDto);
    return response.data;
  },

  async updateTaskOrder({
    taskId, prevId, sectionId
  }: {
    taskId: string;
    sectionId: string;
    prevId: string | null;
  }) {
    await apiClient.patch(`/tasks/${taskId}/reorder`, {
      sectionId,
      prevId,
    });
  },

  async deleteTask(id: string) {
    const response = await apiClient.delete(`/tasks/${id}`);
    return response.data;
  },
};