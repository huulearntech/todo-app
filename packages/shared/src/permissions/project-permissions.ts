import { ProjectRole } from '../enums/project-role.enum.js';

export type ProjectAction =
  | 'project:read'
  | 'project:update'
  | 'project:delete'
  | 'project:transfer'
  | 'section:create'
  | 'section:update'
  | 'section:delete'
  | 'task:create'
  | 'task:update'
  | 'task:move'
  | 'task:complete'
  | 'task:delete'
  | 'member:read'
  | 'member:invite'
  | 'member:manage';

export const ROLE_RANK: Record<ProjectRole, number> = {
  [ProjectRole.VIEWER]: 1,
  [ProjectRole.EDITOR]: 2,
  [ProjectRole.ADMIN]: 3,
  [ProjectRole.OWNER]: 4,
};

export const ROLE_PERMISSIONS: Record<
  ProjectRole,
  ReadonlySet<ProjectAction>
> = {
  [ProjectRole.VIEWER]: new Set<ProjectAction>(['project:read', 'member:read']),
  [ProjectRole.EDITOR]: new Set<ProjectAction>([
    'project:read',
    'member:read',
    'section:create',
    'section:update',
    'section:delete',
    'task:create',
    'task:update',
    'task:move',
    'task:complete',
    'task:delete',
  ]),
  [ProjectRole.ADMIN]: new Set<ProjectAction>([
    'project:read',
    'project:update',
    'member:read',
    'member:invite',
    'member:manage',
    'section:create',
    'section:update',
    'section:delete',
    'task:create',
    'task:update',
    'task:move',
    'task:complete',
    'task:delete',
  ]),
  [ProjectRole.OWNER]: new Set<ProjectAction>([
    'project:read',
    'project:update',
    'project:delete',
    'project:transfer',
    'member:read',
    'member:invite',
    'member:manage',
    'section:create',
    'section:update',
    'section:delete',
    'task:create',
    'task:update',
    'task:move',
    'task:complete',
    'task:delete',
  ]),
};

export function roleCan(
  role: ProjectRole | null | undefined,
  action: ProjectAction,
): boolean {
  if (!role) {
    return false;
  }
  const permissions = ROLE_PERMISSIONS[role];
  return permissions ? permissions.has(action) : false;
}
