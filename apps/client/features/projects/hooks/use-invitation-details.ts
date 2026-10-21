"use client";

import { useQuery } from "@tanstack/react-query";
import { projectMemberService } from "@/features/projects/services/project-member.service";
import { projectQueryKeys } from "@/lib/query/query-keys";

export function useInvitationDetails(token?: string | null) {
  return useQuery({
    queryKey: token
      ? projectQueryKeys.invitationDetails(token)
      : (["invitations", "details", "unknown"] as const),
    queryFn: () => projectMemberService.getInvitationDetails(token!),
    enabled: Boolean(token),
    staleTime: 10_000,
  });
}
