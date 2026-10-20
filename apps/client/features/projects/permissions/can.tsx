"use client";

import type { ReactNode } from "react";
import type { ProjectAction, ProjectRole } from "@todo/shared";
import { useProjectAbilityContext } from "./project-ability-context";
import { roleCan } from "@todo/shared";

export interface CanProps {
  action: ProjectAction;
  role?: ProjectRole | null;
  children: ReactNode;
  fallback?: ReactNode;
}

export function Can({ action, role, children, fallback = null }: CanProps) {
  const contextAbility = useProjectAbilityContext();

  const isAllowed = role !== undefined ? roleCan(role, action) : contextAbility.can(action);

  if (!isAllowed) {
    return fallback;
  }

  return children;
}
