"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { productivityService } from "@/services/productivity.service";
import { productivityQueryKeys } from "@/lib/query/query-keys";
import type { UpdateUserGoalDto } from "@todo/shared";

export function useUpdateGoals() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: UpdateUserGoalDto) => productivityService.updateGoals(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productivityQueryKeys.goals() });
      queryClient.invalidateQueries({ queryKey: productivityQueryKeys.history() });
    },
  });
}
