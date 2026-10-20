"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { projectMemberService } from "@/features/projects/services/project-member.service";
import { projectQueryKeys } from "@/lib/query/query-keys";
import type { AcceptInvitationDto } from "@todo/shared";

export function useAcceptInvitation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: AcceptInvitationDto) =>
      projectMemberService.acceptInvitation(dto),
    onSettled: (data) => {
      queryClient.invalidateQueries({
        queryKey: projectQueryKeys.all,
      });
      if (data?.projectId) {
        queryClient.invalidateQueries({
          queryKey: projectQueryKeys.detail(data.projectId),
        });
      }
    },
  });
}
