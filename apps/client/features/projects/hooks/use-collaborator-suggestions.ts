"use client";

import { useQuery } from "@tanstack/react-query";
import { projectMemberService } from "@/features/projects/services/project-member.service";
import { projectQueryKeys } from "@/lib/query/query-keys";
import type { CollaboratorSuggestionDto } from "@todo/shared";

export const EMPTY_SUGGESTIONS: CollaboratorSuggestionDto[] = [];

export function useCollaboratorSuggestions(
  projectId?: string,
  query?: string,
  enabled: boolean = true,
) {
  return useQuery({
    queryKey: projectQueryKeys.collaboratorSuggestions(projectId, query),
    queryFn: () =>
      projectMemberService.getCollaboratorSuggestions(projectId, query),
    enabled,
    staleTime: 30_000,
  });
}
