"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { projectMemberService } from "@/features/projects/services/project-member.service";
import { projectQueryKeys } from "@/lib/query/query-keys";
import type { CreateInvitationDto } from "@todo/shared";

export function useCreateInvitation(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: CreateInvitationDto) =>
      projectMemberService.createInvitation(projectId, dto),
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: projectQueryKeys.invitations(projectId),
      });
    },
  });
}
