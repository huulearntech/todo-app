import { apiClient } from "@/lib/api-client";

import type {
  CreateSectionDto,
  UpdateSectionDto,
  SectionResponseDto
} from "@todo/shared";


export const sectionService = {
  createSection: async (createSectionDto: CreateSectionDto) => {
    return apiClient.post<SectionResponseDto>("/sections", createSectionDto);
  },

  getMySections: async () => {
    const result = await apiClient.get<SectionResponseDto[]>("/sections/me");
    return result.data;
  },

  getSectionById: async (id: string) => {
    return apiClient.get<SectionResponseDto>(`/sections/${id}`);
  },

  updateSection: async (id: string, updateSectionDto: UpdateSectionDto) => {
    return apiClient.put<SectionResponseDto>(`/sections/${id}`, updateSectionDto);
  },

  updateSectionOrder: async ({ sectionId, prevId }: { sectionId: string, prevId: string | null }) => {
    await apiClient.patch(`/sections/${sectionId}/reorder`, { prevId });
  },

  deleteSection: async (id: string) => {
    return apiClient.delete(`/sections/${id}`);
  },
};