import { apiClient } from "@/lib/api-client";
import type {
  CompleteTaskOccurrenceResponseDto,
  CompleteTaskResponseDto,
  TaskResponseDto as Task,
} from "@todo/shared";

// TODO: may rename?
import type { CreateTaskOutput, UpdateTaskOutput } from "@todo/shared/browser";
import type { TaskFilterDto } from "@todo/shared";


export const taskService = {
  async createTask(createTaskDto: CreateTaskOutput) {
    const response = await apiClient.post<Task>("/tasks", createTaskDto);
    return response.data;
  },

  async getAllTasks() {
    const response = await apiClient.get<Task[]>("/tasks");
    return response.data;
  },

  async getMyTasks(filter?: TaskFilterDto) {
    const response = await apiClient.get<Task[]>("/tasks/me", {
      params: filter,
      paramsSerializer: { indexes: null } // NOTE: This is to prevent axios from serializing array params with brackets, e.g., taskLabelIds[]=1&taskLabelIds[]=2. Instead, we want taskLabelIds=1&taskLabelIds=2
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

  async getMyTasksCompletedInLast7Days() {
    const response = await apiClient.get<Task[]>("/tasks/me/completed-last-7-days", {
      headers: {
        "x-timezone": Intl.DateTimeFormat().resolvedOptions().timeZone, // Send the user's timezone to the server 
      },
    });
    return response.data;
  },

  async updateTask(taskId: string, updateTaskDto: UpdateTaskOutput) {
    const response = await apiClient.patch<Task>(`/tasks/${taskId}`, updateTaskDto);
    return response.data;
  },

  async completeTaskOccurrence(
    taskId: string,
    options?: { scheduledDate?: string; completedAt?: string },
  ) {
    const response = await apiClient.post<CompleteTaskOccurrenceResponseDto>(
      `/tasks/${taskId}/occurrences/complete`,
      options ?? {},
    );
    return response.data;
  },

  async completeTask(taskId: string, completedAt?: string) {
    return this.completeTaskOccurrence(taskId, { completedAt });
  },

  async uncompleteTaskOccurrence(taskId: string) {
    const response = await apiClient.post<Task>(
      `/tasks/${taskId}/occurrences/uncomplete`,
    );
    return response.data;
  },

  async uncompleteTask(taskId: string) {
    return this.uncompleteTaskOccurrence(taskId);
  },

  async postponeTask(taskId: string, postponeTo: string) {
    const response = await apiClient.post<Task>(`/tasks/${taskId}/postpone`, {
      postponeTo,
    });
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