"use client";

import { useQuery } from "@tanstack/react-query";
import { searchService } from "@/features/search/services/search.service";
import { searchQueryKeys } from "@/lib/query/query-keys";
import type { SearchResultsDto } from "@todo/shared";

export const EMPTY_SEARCH_RESULTS: SearchResultsDto = Object.freeze({
  projects: [],
  labels: [],
  tasks: [],
});

export function useGlobalSearch(query: string) {
  const trimmedQuery = query.trim();

  return useQuery<SearchResultsDto, Error>({
    queryKey: searchQueryKeys.global(trimmedQuery),
    queryFn: async () => {
      if (!trimmedQuery) {
        return EMPTY_SEARCH_RESULTS;
      }
      return searchService.search(trimmedQuery);
    },
    enabled: trimmedQuery.length > 0,
    staleTime: 1000 * 30, // 30s cache
  });
}
