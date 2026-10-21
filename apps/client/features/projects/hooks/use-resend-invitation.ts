"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { projectMemberService } from "@/features/projects/services/project-member.service";
import { projectQueryKeys } from "@/lib/query/query-keys";

export function useResendInvitation(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (invitationId: string) =>
      projectMemberService.resendInvitation(projectId, invitationId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: projectQueryKeys.invitations(projectId),
      });
    },
  });
}
