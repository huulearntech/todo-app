"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { projectMemberService } from "@/features/projects/services/project-member.service";
import { projectQueryKeys } from "@/lib/query/query-keys";
import type { UpdateMemberRoleDto } from "@todo/shared";

export function useUpdateMemberRole(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      userId,
      dto,
    }: {
      userId: string;
      dto: UpdateMemberRoleDto;
    }) => projectMemberService.updateMemberRole(projectId, userId, dto),
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: projectQueryKeys.members(projectId),
      });
    },
  });
}
