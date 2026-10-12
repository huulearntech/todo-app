"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { sectionService } from "@/services/section.service";
import { sectionQueryKeys } from "@/lib/query/query-keys";
import type { CreateSectionDto, SectionResponseDto } from "@todo/shared";

export function useCreateSection(hookProjectId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateSectionDto) => sectionService.createSection(data),
    onMutate: async (newSection) => {
      const pid = hookProjectId || newSection.projectId;
      if (!pid) return;

      await queryClient.cancelQueries({ queryKey: sectionQueryKeys.byProject(pid) });

      const previousSections = queryClient.getQueryData<SectionResponseDto[]>(
        sectionQueryKeys.byProject(pid)
      );

      queryClient.setQueryData<SectionResponseDto[]>(
        sectionQueryKeys.byProject(pid),
        (oldItems = []) => [
          ...oldItems,
          { id: `temp-${Date.now()}`, ...newSection, colorKey: newSection.colorKey || "slate" } as SectionResponseDto,
        ]
      );

      return { previousSections, pid };
    },
    onError: (_error, _newSection, context) => {
      if (context?.previousSections && context.pid) {
        queryClient.setQueryData(
          sectionQueryKeys.byProject(context.pid),
          context.previousSections
        );
      }
    },
    onSettled: (_data, _error, variables, context) => {
      const pid = context?.pid || hookProjectId || variables?.projectId;
      if (pid) {
        queryClient.invalidateQueries({ queryKey: sectionQueryKeys.byProject(pid) });
      }
    },
  });
}
