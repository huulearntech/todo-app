"use client";

import { useQuery } from "@tanstack/react-query";
import { colorService } from "@/services/color.service";
import { colorQueryKeys } from "@/lib/query/query-keys";
import type { ColorResponseDto } from "@todo/shared";

export const EMPTY_COLORS: ColorResponseDto[] = [];

export function useColors() {
  return useQuery({
    queryKey: colorQueryKeys.all,
    queryFn: colorService.getColors,
    staleTime: 1000 * 60 * 10, // Colors are rarely changed
  });
}
