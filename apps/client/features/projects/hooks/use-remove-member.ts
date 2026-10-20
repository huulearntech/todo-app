"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { projectMemberService } from "@/features/projects/services/project-member.service";
import { projectQueryKeys } from "@/lib/query/query-keys";

export function useRemoveMember(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (targetUserId: string) =>
      projectMemberService.removeMember(projectId, targetUserId),
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: projectQueryKeys.members(projectId),
      });
      queryClient.invalidateQueries({
        queryKey: projectQueryKeys.all,
      });
    },
  });
}
