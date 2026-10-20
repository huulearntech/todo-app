import { ProjectRole } from '@todo/shared';
import {
  assignableRoles,
  canChangeMemberRole,
  canRemoveMember,
  canInviteWithRole,
  canLeaveProject,
} from '@todo/shared';

describe('MemberPolicy', () => {
  describe('assignableRoles', () => {
    it('should return admin, editor, and viewer for owner', () => {
      expect(assignableRoles(ProjectRole.OWNER)).toEqual([
        ProjectRole.ADMIN,
        ProjectRole.EDITOR,
        ProjectRole.VIEWER,
      ]);
    });

    it('should return editor and viewer for admin', () => {
      expect(assignableRoles(ProjectRole.ADMIN)).toEqual([
        ProjectRole.EDITOR,
        ProjectRole.VIEWER,
      ]);
    });

    it('should return empty array for editor, viewer, or undefined', () => {
      expect(assignableRoles(ProjectRole.EDITOR)).toEqual([]);
      expect(assignableRoles(ProjectRole.VIEWER)).toEqual([]);
      expect(assignableRoles(null)).toEqual([]);
      expect(assignableRoles(undefined)).toEqual([]);
    });
  });

  describe('canChangeMemberRole', () => {
    it('should prevent non-admin/non-owner from changing roles', () => {
      expect(
        canChangeMemberRole(
          ProjectRole.VIEWER,
          ProjectRole.EDITOR,
          ProjectRole.VIEWER,
        ),
      ).toBe(false);
      expect(
        canChangeMemberRole(
          ProjectRole.EDITOR,
          ProjectRole.VIEWER,
          ProjectRole.EDITOR,
        ),
      ).toBe(false);
    });

    it('should never allow changing owner role or promoting to owner', () => {
      expect(
        canChangeMemberRole(
          ProjectRole.OWNER,
          ProjectRole.OWNER,
          ProjectRole.ADMIN,
        ),
      ).toBe(false);
      expect(
        canChangeMemberRole(
          ProjectRole.OWNER,
          ProjectRole.ADMIN,
          ProjectRole.OWNER,
        ),
      ).toBe(false);
    });

    it('should allow owner to change any non-owner member role', () => {
      expect(
        canChangeMemberRole(
          ProjectRole.OWNER,
          ProjectRole.ADMIN,
          ProjectRole.EDITOR,
        ),
      ).toBe(true);
      expect(
        canChangeMemberRole(
          ProjectRole.OWNER,
          ProjectRole.VIEWER,
          ProjectRole.ADMIN,
        ),
      ).toBe(true);
    });

    it('should restrict admin from modifying admins or promoting to admin', () => {
      expect(
        canChangeMemberRole(
          ProjectRole.ADMIN,
          ProjectRole.ADMIN,
          ProjectRole.EDITOR,
        ),
      ).toBe(false);
      expect(
        canChangeMemberRole(
          ProjectRole.ADMIN,
          ProjectRole.VIEWER,
          ProjectRole.ADMIN,
        ),
      ).toBe(false);
      expect(
        canChangeMemberRole(
          ProjectRole.ADMIN,
          ProjectRole.VIEWER,
          ProjectRole.EDITOR,
        ),
      ).toBe(true);
      expect(
        canChangeMemberRole(
          ProjectRole.ADMIN,
          ProjectRole.EDITOR,
          ProjectRole.VIEWER,
        ),
      ).toBe(true);
    });
  });

  describe('canRemoveMember', () => {
    it('should never allow removing the owner', () => {
      expect(
        canRemoveMember(ProjectRole.OWNER, ProjectRole.OWNER, false),
      ).toBe(false);
      expect(
        canRemoveMember(ProjectRole.ADMIN, ProjectRole.OWNER, false),
      ).toBe(false);
      expect(
        canRemoveMember(ProjectRole.OWNER, ProjectRole.OWNER, true),
      ).toBe(false);
    });

    it('should allow non-owner members to voluntarily leave', () => {
      expect(
        canRemoveMember(ProjectRole.ADMIN, ProjectRole.ADMIN, true),
      ).toBe(true);
      expect(
        canRemoveMember(ProjectRole.EDITOR, ProjectRole.EDITOR, true),
      ).toBe(true);
      expect(
        canRemoveMember(ProjectRole.VIEWER, ProjectRole.VIEWER, true),
      ).toBe(true);
    });

    it('should allow owner to remove any non-owner member', () => {
      expect(
        canRemoveMember(ProjectRole.OWNER, ProjectRole.ADMIN, false),
      ).toBe(true);
      expect(
        canRemoveMember(ProjectRole.OWNER, ProjectRole.EDITOR, false),
      ).toBe(true);
      expect(
        canRemoveMember(ProjectRole.OWNER, ProjectRole.VIEWER, false),
      ).toBe(true);
    });

    it('should restrict admin from removing other admins', () => {
      expect(
        canRemoveMember(ProjectRole.ADMIN, ProjectRole.ADMIN, false),
      ).toBe(false);
      expect(
        canRemoveMember(ProjectRole.ADMIN, ProjectRole.EDITOR, false),
      ).toBe(true);
      expect(
        canRemoveMember(ProjectRole.ADMIN, ProjectRole.VIEWER, false),
      ).toBe(true);
    });

    it('should prevent editor or viewer from removing other members', () => {
      expect(
        canRemoveMember(ProjectRole.EDITOR, ProjectRole.VIEWER, false),
      ).toBe(false);
      expect(
        canRemoveMember(ProjectRole.VIEWER, ProjectRole.VIEWER, false),
      ).toBe(false);
    });
  });

  describe('canInviteWithRole', () => {
    it('should allow owner to invite admin, editor, and viewer', () => {
      expect(canInviteWithRole(ProjectRole.OWNER, ProjectRole.ADMIN)).toBe(
        true,
      );
      expect(canInviteWithRole(ProjectRole.OWNER, ProjectRole.EDITOR)).toBe(
        true,
      );
      expect(canInviteWithRole(ProjectRole.OWNER, ProjectRole.VIEWER)).toBe(
        true,
      );
      expect(canInviteWithRole(ProjectRole.OWNER, ProjectRole.OWNER)).toBe(
        false,
      );
    });

    it('should restrict admin from inviting admins', () => {
      expect(canInviteWithRole(ProjectRole.ADMIN, ProjectRole.ADMIN)).toBe(
        false,
      );
      expect(canInviteWithRole(ProjectRole.ADMIN, ProjectRole.EDITOR)).toBe(
        true,
      );
      expect(canInviteWithRole(ProjectRole.ADMIN, ProjectRole.VIEWER)).toBe(
        true,
      );
    });

    it('should prevent editor or viewer from inviting', () => {
      expect(canInviteWithRole(ProjectRole.EDITOR, ProjectRole.VIEWER)).toBe(
        false,
      );
      expect(canInviteWithRole(ProjectRole.VIEWER, ProjectRole.VIEWER)).toBe(
        false,
      );
    });
  });

  describe('canLeaveProject', () => {
    it('should allow admin, editor, viewer to leave and prevent owner', () => {
      expect(canLeaveProject(ProjectRole.OWNER)).toBe(false);
      expect(canLeaveProject(ProjectRole.ADMIN)).toBe(true);
      expect(canLeaveProject(ProjectRole.EDITOR)).toBe(true);
      expect(canLeaveProject(ProjectRole.VIEWER)).toBe(true);
      expect(canLeaveProject(null)).toBe(false);
      expect(canLeaveProject(undefined)).toBe(false);
    });
  });
});
