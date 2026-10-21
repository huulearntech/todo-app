"use client";

import { useCallback } from "react";
import { useSections, EMPTY_SECTIONS } from "@/features/sections/hooks/use-sections";
import { useProjectTasks, EMPTY_TASKS } from "@/features/tasks/hooks/use-project-tasks";
import { useCreateSection } from "@/features/sections/hooks/use-create-section";
import { toast } from "@/components/ui/toast";

export function useEnsureTaskSection(projectId: string) {
  const { data: sections = EMPTY_SECTIONS } = useSections(projectId);
  const { data: tasks = EMPTY_TASKS } = useProjectTasks(projectId);
  const createSectionMutation = useCreateSection();

  const getOrCreateSectionId = useCallback(async (): Promise<string | null> => {
    const targetSectionId = sections[0]?.id || tasks[0]?.sectionId;

    if (targetSectionId) {
      return targetSectionId;
    }

    try {
      const response = await createSectionMutation.mutateAsync({
        projectId,
        name: "Tasks",
      });
      return response.data.id;
    } catch {
      toast.add({
        title: "Error",
        description: "Could not find or create a section for this project.",
        type: "error",
      });
      return null;
    }
  }, [sections, tasks, createSectionMutation, projectId]);

  return {
    getOrCreateSectionId,
    isCreating: createSectionMutation.isPending,
  };
}
