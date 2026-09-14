import { apiClient } from "@/lib/api-client";
import { Task } from "@/types/task.type";

// TODO: @Cleanup @Robustness
type CreateTaskReqDto = {
  title: string;
  description?: string;
  dueDate?: Date;
  priority?: "low" | "medium" | "high";
  completed?: boolean;
};

export const taskService = {
  async createTask(createTaskReqDto: CreateTaskReqDto) {
    const response = await apiClient.post<Task>("/tasks", createTaskReqDto);
    console.log("createTask response:", response.data);
    return response.data;
  },

  async getAllTasks() {
    const response = await apiClient.get<Task[]>("/tasks");
    return response.data;
  },

  async getMyTasks(filter?: {
    title?: string;
    status?: string;
    projectId?: string;
  }) { // TODO: should make a type out of this
    const response = await apiClient.get<Task[]>("/tasks/me", {
      params: filter,
    });
    return response.data;
  },

  async deleteTask(id: number) {
    const response = await apiClient.delete(`/tasks/${id}`);
    return response.data;
  },
};