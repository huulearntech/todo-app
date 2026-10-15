import { apiClient } from "@/lib/api-client";
import type { SearchResultsDto } from "@todo/shared";

export const searchService = {
  search: async (query: string): Promise<SearchResultsDto> => {
    const response = await apiClient.get<SearchResultsDto>("/search", {
      params: { q: query },
    });
    return response.data;
  },
};
