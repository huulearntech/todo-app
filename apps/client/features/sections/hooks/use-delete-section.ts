"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { sectionService } from "@/features/sections/services/section.service";
import { sectionQueryKeys, taskQueryKeys } from "@/lib/query/query-keys";
import { toast } from "@/components/ui/toast";
import type { SectionResponseDto } from "@todo/shared";

export function useDeleteSection(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (sectionId: string) => {
      await sectionService.deleteSection(sectionId);
    },
    onMutate: async (sectionId) => {
      await queryClient.cancelQueries({ queryKey: sectionQueryKeys.byProject(projectId) });
      const previousSections = queryClient.getQueryData<SectionResponseDto[]>(
        sectionQueryKeys.byProject(projectId)
      );

      queryClient.setQueryData<SectionResponseDto[]>(
        sectionQueryKeys.byProject(projectId),
        (oldItems = []) => oldItems.filter((s) => s.id !== sectionId)
      );

      return { previousSections };
    },
    onError: (_err, _sectionId, onMutateResult) => {
      if (onMutateResult?.previousSections) {
        queryClient.setQueryData(
          sectionQueryKeys.byProject(projectId),
          onMutateResult.previousSections
        );
      }
      toast.add({
        title: "Error deleting section",
        description: "Failed to delete section. Please try again.",
        type: "error",
      });
    },
    onSuccess: () => {
      toast.add({
        title: "Section deleted",
        description: "Section has been removed.",
        type: "success",
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: sectionQueryKeys.byProject(projectId) });
      queryClient.invalidateQueries({ queryKey: taskQueryKeys.byProject(projectId) });
    },
  });
}
