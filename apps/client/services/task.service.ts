import { apiClient } from "@/lib/api-client";
import { Task } from "@/types/task.type";

// TODO: may rename?
import type { TaskFilterOutput, CreateTaskOutput, UpdateTaskOutput } from "@todo/shared/browser";


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

  async getMyTasks(filter?: TaskFilterOutput) {
    const response = await apiClient.get<Task[]>("/tasks/me", {
      params: filter,
    });
    return response.data;
  },

  // TODO: @Cleanup @Temporary
  // async getMyTasks_New(filter?: TaskFilterDto) {
  //   const response = await apiClient.get<Task[]>("/tasks/me/new", {
  //     params: filter,
  //   });
  //   return response.data;
  // },

  async getTasksByProjectId(projectId: string, filter?: Omit<TaskFilterOutput, "projectId">) {
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
    console.log("getMyTasksByLabelId called with labelId:", labelId);
    const response = await apiClient.get<Task[]>(`/tasks/tempbylabel/${labelId}`);
    return response.data;
  },

  async updateTask(taskId: string, updateTaskDto: UpdateTaskOutput) {
    console.log("updateTask called with taskId:", taskId, "and updateTaskDto:", updateTaskDto);
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