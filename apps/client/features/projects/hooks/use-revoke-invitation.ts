"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { projectMemberService } from "@/features/projects/services/project-member.service";
import { projectQueryKeys } from "@/lib/query/query-keys";

export function useRevokeInvitation(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (invitationId: string) =>
      projectMemberService.revokeInvitation(projectId, invitationId),
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: projectQueryKeys.invitations(projectId),
      });
    },
  });
}
