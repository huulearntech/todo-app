"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { sectionService } from "@/services/section.service";
import { sectionQueryKeys } from "@/lib/query/query-keys";
import { toast } from "@/components/ui/toast";
import type { SectionResponseDto } from "@todo/shared";

interface RenameSectionVariables {
  sectionId: string;
  name: string;
}

export function useRenameSection(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ sectionId, name }: RenameSectionVariables) => {
      await sectionService.updateSection(sectionId, { name });
    },
    onMutate: async ({ sectionId, name }) => {
      await queryClient.cancelQueries({ queryKey: sectionQueryKeys.byProject(projectId) });
      const previousSections = queryClient.getQueryData<SectionResponseDto[]>(
        sectionQueryKeys.byProject(projectId)
      );

      queryClient.setQueryData<SectionResponseDto[]>(
        sectionQueryKeys.byProject(projectId),
        (oldItems = []) => oldItems.map((s) => (s.id === sectionId ? { ...s, name } : s))
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
      toast.add({
        title: "Error renaming section",
        description: "Failed to update section name. Please try again.",
        type: "error",
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: sectionQueryKeys.byProject(projectId) });
    },
  });
}
