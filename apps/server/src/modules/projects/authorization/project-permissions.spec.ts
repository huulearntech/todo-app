import { ProjectRole } from '@todo/shared';
import { ProjectAction, ROLE_RANK, roleCan } from './project-permissions';

describe('ProjectPermissions', () => {
  describe('roleCan', () => {
    it('should grant viewer only read actions', () => {
      expect(roleCan(ProjectRole.VIEWER, 'project:read')).toBe(true);
      expect(roleCan(ProjectRole.VIEWER, 'member:read')).toBe(true);
      expect(roleCan(ProjectRole.VIEWER, 'task:create')).toBe(false);
      expect(roleCan(ProjectRole.VIEWER, 'task:update')).toBe(false);
      expect(roleCan(ProjectRole.VIEWER, 'project:update')).toBe(false);
      expect(roleCan(ProjectRole.VIEWER, 'member:manage')).toBe(false);
      expect(roleCan(ProjectRole.VIEWER, 'project:delete')).toBe(false);
    });

    it('should grant editor task and section write actions but not member manage or project delete', () => {
      expect(roleCan(ProjectRole.EDITOR, 'project:read')).toBe(true);
      expect(roleCan(ProjectRole.EDITOR, 'task:create')).toBe(true);
      expect(roleCan(ProjectRole.EDITOR, 'task:update')).toBe(true);
      expect(roleCan(ProjectRole.EDITOR, 'task:complete')).toBe(true);
      expect(roleCan(ProjectRole.EDITOR, 'section:create')).toBe(true);
      expect(roleCan(ProjectRole.EDITOR, 'project:update')).toBe(false);
      expect(roleCan(ProjectRole.EDITOR, 'member:manage')).toBe(false);
      expect(roleCan(ProjectRole.EDITOR, 'project:delete')).toBe(false);
    });

    it('should grant admin project update and member manage but not delete project', () => {
      expect(roleCan(ProjectRole.ADMIN, 'project:read')).toBe(true);
      expect(roleCan(ProjectRole.ADMIN, 'project:update')).toBe(true);
      expect(roleCan(ProjectRole.ADMIN, 'member:invite')).toBe(true);
      expect(roleCan(ProjectRole.ADMIN, 'member:manage')).toBe(true);
      expect(roleCan(ProjectRole.ADMIN, 'task:create')).toBe(true);
      expect(roleCan(ProjectRole.ADMIN, 'project:delete')).toBe(false);
      expect(roleCan(ProjectRole.ADMIN, 'project:transfer')).toBe(false);
    });

    it('should grant owner all actions', () => {
      const allActions: ProjectAction[] = [
        'project:read',
        'project:update',
        'project:delete',
        'project:transfer',
        'section:create',
        'section:update',
        'section:delete',
        'task:create',
        'task:update',
        'task:move',
        'task:complete',
        'task:delete',
        'member:read',
        'member:invite',
        'member:manage',
      ];

      for (const action of allActions) {
        expect(roleCan(ProjectRole.OWNER, action)).toBe(true);
      }
    });
  });

  describe('ROLE_RANK', () => {
    it('should follow strict hierarchy: viewer < editor < admin < owner', () => {
      expect(ROLE_RANK[ProjectRole.VIEWER]).toBeLessThan(
        ROLE_RANK[ProjectRole.EDITOR],
      );
      expect(ROLE_RANK[ProjectRole.EDITOR]).toBeLessThan(
        ROLE_RANK[ProjectRole.ADMIN],
      );
      expect(ROLE_RANK[ProjectRole.ADMIN]).toBeLessThan(
        ROLE_RANK[ProjectRole.OWNER],
      );
    });
  });
});
