import { apiClient } from "@/lib/api-client";
import type { ColorResponseDto } from "@todo/shared";

export const colorService = {
  getColors: async (): Promise<ColorResponseDto[]> => {
    const response = await apiClient.get<ColorResponseDto[]>("/colors");
    return response.data;
  },
  getMyColors: async (): Promise<ColorResponseDto[]> => {
    return colorService.getColors();
  },
};
