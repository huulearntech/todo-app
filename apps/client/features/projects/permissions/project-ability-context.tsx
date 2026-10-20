"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { ProjectRole } from "@todo/shared";
import { useProjectAbility, type ProjectAbility } from "./use-project-ability";

const defaultAbility: ProjectAbility = {
  role: undefined,
  can: () => false,
  assignableRoles: [],
  canChangeMemberRole: () => false,
  canRemoveMember: () => false,
  canInviteWithRole: () => false,
  canLeave: false,
  isReadOnly: false,
};

const ProjectAbilityContext = createContext<ProjectAbility>(defaultAbility);

export interface ProjectAbilityProviderProps {
  role?: ProjectRole | null;
  children: ReactNode;
}

export function ProjectAbilityProvider({
  role,
  children,
}: ProjectAbilityProviderProps) {
  const ability = useProjectAbility(role);

  return (
    <ProjectAbilityContext.Provider value={ability}>
      {children}
    </ProjectAbilityContext.Provider>
  );
}

export function useProjectAbilityContext(): ProjectAbility {
  return useContext(ProjectAbilityContext);
}
