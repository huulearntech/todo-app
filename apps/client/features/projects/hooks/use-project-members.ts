"use client";

import { useQuery } from "@tanstack/react-query";
import { projectMemberService } from "@/features/projects/services/project-member.service";
import { projectQueryKeys } from "@/lib/query/query-keys";
import type { ProjectMemberResponseDto } from "@todo/shared";

export const EMPTY_MEMBERS: ProjectMemberResponseDto[] = [];

export function useProjectMembers(projectId?: string) {
  return useQuery({
    queryKey: projectId
      ? projectQueryKeys.members(projectId)
      : (["projects", "unknown", "members"] as const),
    queryFn: () => projectMemberService.getMembers(projectId!),
    enabled: Boolean(projectId),
  });
}
