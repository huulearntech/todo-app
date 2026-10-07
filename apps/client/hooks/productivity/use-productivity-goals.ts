"use client";

import { useQuery } from "@tanstack/react-query";
import { productivityService } from "@/services/productivity.service";
import { productivityQueryKeys } from "@/lib/query/query-keys";

export function useProductivityGoals() {
  return useQuery({
    queryKey: productivityQueryKeys.goals(),
    queryFn: () => productivityService.getGoalProgress(),
  });
}
