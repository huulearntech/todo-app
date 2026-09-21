import { apiClient } from "@/lib/api-client";
import { Section } from "@/types/section.type";

export type CreateSectionDto = {
  projectId: string;
  name: string;
  description?: string;
};

export const sectionService = {
  createSection: async (createSectionDto: CreateSectionDto) => {
    return apiClient.post<Section>("/sections", createSectionDto);
  },
  getAllSections: async () => {
    return apiClient.get<Section[]>("/sections");
  },
  getMySections: async () => {
    const result = await apiClient.get<Section[]>("/sections/me");
    return result.data;
  },

  // TODO: @Cleanup @Temporary
  getSectionsByProjectId: async (projectId: string) => {
    const result = await apiClient.get<{
      id: string;
      name: string;
    }[]>(`/sections/project/${projectId}`);
    return result.data;
  },

  getSectionById: async (id: string) => {
    return apiClient.get<Section>(`/sections/${id}`);
  },

  // TODO: body data
  updateSection: async (id: string, name: string, description?: string) => {
    return apiClient.put<Section>(`/sections/${id}`, { name, description });
  },

  updateSectionOrder: async ({ id, prevId }: { id: string, prevId: string | null }) => {
    await apiClient.patch(`/sections/${id}/reorder`, { prevId });
  },

  deleteSection: async (id: string) => {
    return apiClient.delete(`/sections/${id}`);
  },
};