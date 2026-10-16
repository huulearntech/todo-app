"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { sectionService } from "@/features/sections/services/section.service";
import { sectionQueryKeys } from "@/lib/query/query-keys";
import type { SectionResponseDto } from "@todo/shared";

interface MoveSectionVariables {
  sectionId: string;
  prevId: string | null;
}

export function useMoveSection(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ sectionId, prevId }: MoveSectionVariables) => {
      await sectionService.updateSectionOrder({ sectionId, prevId });
    },
    onMutate: async ({ sectionId, prevId }) => {
      await queryClient.cancelQueries({ queryKey: sectionQueryKeys.byProject(projectId) });
      const previousSections = queryClient.getQueryData<SectionResponseDto[]>(
        sectionQueryKeys.byProject(projectId)
      );

      // Optimistically update the UI state for immediate feedback
      queryClient.setQueryData<SectionResponseDto[]>(
        sectionQueryKeys.byProject(projectId),
        (oldItems = []) => {
          const sectionToMove = oldItems.find((s) => s.id === sectionId);
          if (!sectionToMove) return oldItems;

          const newItems = oldItems.filter((s) => s.id !== sectionId);
          const prevIndex = prevId ? newItems.findIndex((s) => s.id === prevId) : -1;
          const newIndex = prevIndex + 1;

          newItems.splice(newIndex, 0, sectionToMove);
          return newItems;
        }
      );

      return { previousSections };
    },
    onError: (_err, _variables, onMutateResult) => {
      if (onMutateResult?.previousSections) {
        queryClient.setQueryData(
          sectionQueryKeys.byProject(projectId),
          onMutateResult.previousSections
        );
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: sectionQueryKeys.byProject(projectId) });
    },
  });
}
