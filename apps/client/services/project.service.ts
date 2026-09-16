import { apiClient } from "@/lib/api-client";
import { Project } from "@/types/project.type";

export type CreateProjectDto = {
  name: string;
  description?: string;
};

export const projectService = {
  createProject: async (createProjectDto: CreateProjectDto) => {
    return apiClient.post<Project>("/projects", createProjectDto);
  },
  getAllProjects: async () => {
    return apiClient.get<Project[]>("/projects");
  },
  getMyProjects: async (filter?: {
    name?: string;
  }) => {
    const result = await apiClient.get<Project[]>("/projects/me", {
      params: filter,
    });
    return result.data;
  },
  getMyNonDefaultProjects: async () => {
    const result = await apiClient.get<Project[]>("/projects/me", {
      params: {
        isDefault: false,
      },
    });
    return result.data;
  },
  getProjectById: async (id: string) => {
    const response = await apiClient.get<Project>(`/projects/${id}`);
    return response.data;
  },
  updateProject: async (id: string, name: string, description?: string) => {
    return apiClient.put<Project>(`/projects/${id}`, { name, description });
  },
  deleteProject: async (id: string) => {
    return apiClient.delete(`/projects/${id}`);
  },
};