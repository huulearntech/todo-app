import { apiClient } from "@/lib/api-client";

import type {
  SectionResponseDto,
  CreateProjectDto,
  ProjectResponseDto,
  ProjectFilterDto,
} from "@todo/shared";

export const projectService = {
  createProject: async (createProjectDto: CreateProjectDto) => {
    return apiClient.post<ProjectResponseDto>("/projects", createProjectDto);
  },
  getAllProjects: async () => {
    return apiClient.get<ProjectResponseDto[]>("/projects");
  },
  getMyProjects: async (filter?: ProjectFilterDto) => {
    const result = await apiClient.get<ProjectResponseDto[]>("/projects/me", {
      params: filter,
    });
    return result.data;
  },
  getMyNonDefaultProjects: async () => {
    const result = await apiClient.get<ProjectResponseDto[]>("/projects/me", {
      params: {
        isDefault: false,
      },
    });
    return result.data;
  },
  getProjectById: async (id: string) => {
    const response = await apiClient.get<ProjectResponseDto>(`/projects/${id}`);
    return response.data;
  },

  getSectionsByProjectId: async (projectId: string) => {
    const result = await apiClient.get<SectionResponseDto[]>(`/projects/${projectId}/sections`);
    return result.data;
  },

  updateProject: async (id: string, name: string, description?: string) => {
    return apiClient.put<ProjectResponseDto>(`/projects/${id}`, { name, description });
  },
  deleteProject: async (id: string) => {
    return apiClient.delete(`/projects/${id}`);
  },
};