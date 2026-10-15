"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { sectionService } from "@/features/projects/services/section.service";
import { sectionQueryKeys } from "@/lib/query/query-keys";
import { toast } from "@/components/ui/toast";
import type { SectionResponseDto, UpdateSectionDto } from "@todo/shared";

interface UpdateSectionVariables {
  sectionId: string;
  data: UpdateSectionDto;
}

export function useUpdateSection(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ sectionId, data }: UpdateSectionVariables) => {
      return sectionService.updateSection(sectionId, data);
    },
    onMutate: async ({ sectionId, data }) => {
      await queryClient.cancelQueries({ queryKey: sectionQueryKeys.byProject(projectId) });
      const previousSections = queryClient.getQueryData<SectionResponseDto[]>(
        sectionQueryKeys.byProject(projectId)
      );

      queryClient.setQueryData<SectionResponseDto[]>(
        sectionQueryKeys.byProject(projectId),
        (oldItems = []) =>
          oldItems.map((s) =>
            s.id === sectionId ? { ...s, ...data } : s
          )
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
        title: "Error updating section",
        description: "Failed to update section. Please try again.",
        type: "error",
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: sectionQueryKeys.byProject(projectId) });
    },
  });
}
