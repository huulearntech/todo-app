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
  getMyProjects: async () => {
    const result = await apiClient.get<Project[]>("/projects/me");
    return result.data;
  },
  getProjectById: async (id: string) => {
    return apiClient.get<Project>(`/projects/${id}`);
  },
  updateProject: async (id: string, name: string, description?: string) => {
    return apiClient.put<Project>(`/projects/${id}`, { name, description });
  },
  deleteProject: async (id: string) => {
    return apiClient.delete(`/projects/${id}`);
  },
};