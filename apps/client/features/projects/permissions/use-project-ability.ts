"use client";

import { useCallback, useMemo } from "react";
import { roleCan, type ProjectAction, type ProjectRole } from "@todo/shared";

export interface ProjectAbility {
  role?: ProjectRole | null;
  can: (action: ProjectAction) => boolean;
}

export function useProjectAbility(role?: ProjectRole | null): ProjectAbility {
  const can = useCallback(
    (action: ProjectAction) => roleCan(role, action),
    [role],
  );

  return useMemo(() => ({ role, can }), [role, can]);
}
