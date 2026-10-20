"use client";

import { useCallback, useMemo } from "react";
import {
  roleCan,
  assignableRoles,
  canChangeMemberRole,
  canRemoveMember,
  canInviteWithRole,
  canLeaveProject,
  ProjectRole,
  type ProjectAction,
} from "@todo/shared";

export interface ProjectAbility {
  role?: ProjectRole | null;
  can: (action: ProjectAction) => boolean;
  assignableRoles: ProjectRole[];
  canChangeMemberRole: (
    targetCurrentRole: ProjectRole,
    newRole: ProjectRole,
  ) => boolean;
  canRemoveMember: (targetRole: ProjectRole, isSelf: boolean) => boolean;
  canInviteWithRole: (inviteRole: ProjectRole) => boolean;
  canLeave: boolean;
  isReadOnly: boolean;
}

export function useProjectAbility(role?: ProjectRole | null): ProjectAbility {
  const can = useCallback(
    (action: ProjectAction) => roleCan(role, action),
    [role],
  );

  const rolesAssignable = useMemo(() => assignableRoles(role), [role]);

  const checkChangeMemberRole = useCallback(
    (targetCurrentRole: ProjectRole, newRole: ProjectRole) =>
      canChangeMemberRole(role, targetCurrentRole, newRole),
    [role],
  );

  const checkRemoveMember = useCallback(
    (targetRole: ProjectRole, isSelf: boolean) =>
      canRemoveMember(role, targetRole, isSelf),
    [role],
  );

  const checkInviteWithRole = useCallback(
    (inviteRole: ProjectRole) => canInviteWithRole(role, inviteRole),
    [role],
  );

  const canLeave = useMemo(() => canLeaveProject(role), [role]);
  const isReadOnly = role === ProjectRole.VIEWER;

  return useMemo(
    () => ({
      role,
      can,
      assignableRoles: rolesAssignable,
      canChangeMemberRole: checkChangeMemberRole,
      canRemoveMember: checkRemoveMember,
      canInviteWithRole: checkInviteWithRole,
      canLeave,
      isReadOnly,
    }),
    [
      role,
      can,
      rolesAssignable,
      checkChangeMemberRole,
      checkRemoveMember,
      checkInviteWithRole,
      canLeave,
      isReadOnly,
    ],
  );
}
