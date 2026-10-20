"use client";

import { useQuery } from "@tanstack/react-query";
import { projectMemberService } from "@/features/projects/services/project-member.service";
import { projectQueryKeys } from "@/lib/query/query-keys";
import type { ProjectInvitationResponseDto } from "@todo/shared";

export const EMPTY_INVITATIONS: ProjectInvitationResponseDto[] = [];

export function useProjectInvitations(projectId?: string) {
  return useQuery({
    queryKey: projectId
      ? projectQueryKeys.invitations(projectId)
      : (["projects", "unknown", "invitations"] as const),
    queryFn: () => projectMemberService.getPendingInvitations(projectId!),
    enabled: Boolean(projectId),
  });
}
