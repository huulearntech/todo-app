"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { projectMemberService } from "@/features/projects/services/project-member.service";
import { projectQueryKeys } from "@/lib/query/query-keys";
import type { TransferProjectDto } from "@todo/shared";

export function useTransferOwnership(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: TransferProjectDto) =>
      projectMemberService.transferOwnership(projectId, dto),
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: projectQueryKeys.all,
      });
      queryClient.invalidateQueries({
        queryKey: projectQueryKeys.members(projectId),
      });
    },
  });
}
