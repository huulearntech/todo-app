import { ProjectRole } from '../enums/project-role.enum.js';
import { roleCan } from './project-permissions.js';

export type AssignableRole =
  | ProjectRole.ADMIN
  | ProjectRole.EDITOR
  | ProjectRole.VIEWER;

/**
 * Roles that an actor with `actorRole` is allowed to assign when inviting or updating members.
 */
export function assignableRoles(
  actorRole: ProjectRole | null | undefined,
): AssignableRole[] {
  if (!actorRole) return [];
  if (actorRole === ProjectRole.OWNER) {
    return [ProjectRole.ADMIN, ProjectRole.EDITOR, ProjectRole.VIEWER];
  }
  if (actorRole === ProjectRole.ADMIN) {
    return [ProjectRole.EDITOR, ProjectRole.VIEWER];
  }
  return [];
}

/**
 * Checks if an actor can change the role of a target member.
 */
export function canChangeMemberRole(
  actorRole: ProjectRole | null | undefined,
  targetCurrentRole: ProjectRole,
  newRole: ProjectRole,
): boolean {
  if (!roleCan(actorRole, 'member:manage')) {
    return false;
  }

  // The project owner's role cannot be changed via member management
  if (targetCurrentRole === ProjectRole.OWNER) {
    return false;
  }

  // Nobody can be promoted to Owner via member role change (only project:transfer)
  if (newRole === ProjectRole.OWNER) {
    return false;
  }

  if (actorRole === ProjectRole.ADMIN) {
    // Admin cannot change roles of other Admins
    if (targetCurrentRole === ProjectRole.ADMIN) {
      return false;
    }
    // Admin cannot promote someone to Admin
    if (newRole === ProjectRole.ADMIN) {
      return false;
    }
    return true;
  }

  if (actorRole === ProjectRole.OWNER) {
    return true;
  }

  return false;
}

/**
 * Checks if an actor can remove a member (or voluntarily leave).
 */
export function canRemoveMember(
  actorRole: ProjectRole | null | undefined,
  targetRole: ProjectRole,
  isSelf: boolean,
): boolean {
  // The owner can never be removed from their project, and cannot leave their own project
  if (targetRole === ProjectRole.OWNER) {
    return false;
  }

  // Voluntary leave by any non-owner member
  if (isSelf) {
    return Boolean(actorRole && actorRole !== ProjectRole.OWNER);
  }

  // Removing another member requires member:manage
  if (!roleCan(actorRole, 'member:manage')) {
    return false;
  }

  if (actorRole === ProjectRole.ADMIN) {
    // Admin cannot remove other Admins
    if (targetRole === ProjectRole.ADMIN) {
      return false;
    }
    return true;
  }

  if (actorRole === ProjectRole.OWNER) {
    return true;
  }

  return false;
}

/**
 * Checks if an actor can invite a collaborator with `inviteRole`.
 */
export function canInviteWithRole(
  actorRole: ProjectRole | null | undefined,
  inviteRole: ProjectRole,
): boolean {
  if (!roleCan(actorRole, 'member:invite')) {
    return false;
  }

  if (inviteRole === ProjectRole.OWNER) {
    return false;
  }

  if (actorRole === ProjectRole.ADMIN) {
    return inviteRole === ProjectRole.EDITOR || inviteRole === ProjectRole.VIEWER;
  }

  if (actorRole === ProjectRole.OWNER) {
    return true;
  }

  return false;
}

/**
 * Whether a user with the given role can voluntarily leave the project.
 */
export function canLeaveProject(role: ProjectRole | null | undefined): boolean {
  return Boolean(role && role !== ProjectRole.OWNER);
}

/**
 * Whether a user with the given role can transfer ownership of the project.
 */
export function canTransferProject(
  role: ProjectRole | null | undefined,
): boolean {
  return role === ProjectRole.OWNER;
}
