import {
  type ProjectResponseDto,
  type ProjectMemberResponseDto,
  ProjectRole,
} from "@todo/shared";

/**
 * Returns the member record for the given user in the project.
 */
export function getProjectMember(
  project?: ProjectResponseDto | null,
  userId?: string | null,
): ProjectMemberResponseDto | undefined {
  if (!project || !userId || !project.members) {
    return undefined;
  }
  return project.members.find((m) => m.userId === userId);
}

/**
 * Returns the user who is the owner of the project.
 */
export function getProjectOwner(project?: ProjectResponseDto | null) {
  if (!project || !project.members) {
    return undefined;
  }
  const ownerMember = project.members.find((m) => m.role === ProjectRole.OWNER);
  return ownerMember?.user;
}

/**
 * Checks whether the given user is the owner of the project.
 */
export function isProjectOwner(
  project?: ProjectResponseDto | null,
  userId?: string | null,
): boolean {
  if (!project || !userId) {
    return false;
  }
  const member = getProjectMember(project, userId);
  return member?.role === ProjectRole.OWNER;
}

/**
 * Checks whether the project is shared with other members (more than 1 participant).
 */
export function isProjectShared(project?: ProjectResponseDto | null): boolean {
  return (project?.members?.length ?? 0) > 1;
}
