import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Repository, DataSource } from 'typeorm';
import crypto from 'node:crypto';
import { ProjectMemberService } from './project-member.service';
import { ProjectMember } from './entities/project-member.entity';
import { ProjectInvitation } from './entities/project-invitation.entity';
import { Project } from './project.entity';
import { User } from '../users/user.entity';
import { ProjectAccessService } from './authorization/project-access.service';
import { ProjectRole, ProjectInvitationStatus } from '@todo/shared';

describe('ProjectMemberService', () => {
  let service: ProjectMemberService;
  let accessService: jest.Mocked<ProjectAccessService>;

  const mockMemberRepo = {
    find: jest.fn(),
    findOne: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
    create: jest.fn(),
  };

  const mockInvitationRepo = {
    find: jest.fn(),
    findOne: jest.fn(),
    save: jest.fn(),
    create: jest.fn(),
  };

  const mockProjectRepo = {
    findOne: jest.fn(),
  };

  const mockUserRepo = {
    findOne: jest.fn(),
  };

  const mockAccessService = {
    assertCan: jest.fn(),
    getRole: jest.fn(),
    applyMembershipScope: jest.fn(),
  };

  const mockTransactionManager = {
    save: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
  };

  const mockDataSource = {
    transaction: jest.fn((cb) => cb(mockTransactionManager)),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProjectMemberService,
        {
          provide: getRepositoryToken(ProjectMember),
          useValue: mockMemberRepo,
        },
        {
          provide: getRepositoryToken(ProjectInvitation),
          useValue: mockInvitationRepo,
        },
        {
          provide: getRepositoryToken(Project),
          useValue: mockProjectRepo,
        },
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepo,
        },
        {
          provide: ProjectAccessService,
          useValue: mockAccessService,
        },
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
      ],
    }).compile();

    service = module.get<ProjectMemberService>(ProjectMemberService);
    accessService = module.get(ProjectAccessService);
  });

  describe('getMembers', () => {
    it('should assert member:read and return project members with user relation', async () => {
      accessService.assertCan.mockResolvedValue(ProjectRole.VIEWER);
      const members = [
        { id: 'm-1', role: ProjectRole.OWNER },
      ] as ProjectMember[];
      mockMemberRepo.find.mockResolvedValue(members);

      const result = await service.getMembers('user-1', 'proj-1');

      expect(accessService.assertCan).toHaveBeenCalledWith(
        'user-1',
        'proj-1',
        'member:read',
      );
      expect(mockMemberRepo.find).toHaveBeenCalledWith({
        where: { projectId: 'proj-1' },
        relations: { user: true },
        order: { createdAt: 'ASC' },
      });
      expect(result).toBe(members);
    });
  });

  describe('updateMemberRole', () => {
    it('should prevent changing the role of the project owner', async () => {
      accessService.assertCan.mockResolvedValue(ProjectRole.OWNER);
      mockProjectRepo.findOne.mockResolvedValue({
        id: 'proj-1',
        ownerId: 'owner-id',
      });

      await expect(
        service.updateMemberRole('owner-id', 'proj-1', 'owner-id', {
          role: ProjectRole.ADMIN,
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should prevent admin from promoting someone to admin', async () => {
      accessService.assertCan.mockResolvedValue(ProjectRole.ADMIN);
      mockProjectRepo.findOne.mockResolvedValue({
        id: 'proj-1',
        ownerId: 'owner-id',
      });
      mockMemberRepo.findOne.mockResolvedValue({
        id: 'm-2',
        role: ProjectRole.VIEWER,
      });

      await expect(
        service.updateMemberRole('admin-id', 'proj-1', 'target-id', {
          role: ProjectRole.ADMIN,
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should prevent admin from modifying role of another admin', async () => {
      accessService.assertCan.mockResolvedValue(ProjectRole.ADMIN);
      mockProjectRepo.findOne.mockResolvedValue({
        id: 'proj-1',
        ownerId: 'owner-id',
      });
      mockMemberRepo.findOne.mockResolvedValue({
        id: 'm-2',
        role: ProjectRole.ADMIN,
      });

      await expect(
        service.updateMemberRole('admin-id', 'proj-1', 'other-admin-id', {
          role: ProjectRole.EDITOR,
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should allow owner to update role of an editor to admin', async () => {
      accessService.assertCan.mockResolvedValue(ProjectRole.OWNER);
      mockProjectRepo.findOne.mockResolvedValue({
        id: 'proj-1',
        ownerId: 'owner-id',
      });
      const targetMember = {
        id: 'm-2',
        role: ProjectRole.EDITOR,
      } as ProjectMember;
      mockMemberRepo.findOne.mockResolvedValue(targetMember);
      mockMemberRepo.save.mockImplementation((m) => m as ProjectMember);

      const updated = await service.updateMemberRole(
        'owner-id',
        'proj-1',
        'target-id',
        {
          role: ProjectRole.ADMIN,
        },
      );

      expect(updated.role).toBe(ProjectRole.ADMIN);
      expect(mockMemberRepo.save).toHaveBeenCalled();
    });
  });

  describe('removeMember', () => {
    it('should prevent removing the project owner', async () => {
      mockProjectRepo.findOne.mockResolvedValue({
        id: 'proj-1',
        ownerId: 'owner-id',
      });

      await expect(
        service.removeMember('owner-id', 'proj-1', 'owner-id'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should allow a member to leave voluntarily without needing member:manage', async () => {
      mockProjectRepo.findOne.mockResolvedValue({
        id: 'proj-1',
        ownerId: 'owner-id',
      });
      mockMemberRepo.findOne.mockResolvedValue({
        id: 'm-target',
        userId: 'user-leave',
      });

      await service.removeMember('user-leave', 'proj-1', 'user-leave');

      expect(accessService.assertCan).not.toHaveBeenCalled();
      expect(mockMemberRepo.delete).toHaveBeenCalledWith({ id: 'm-target' });
    });

    it('should prevent admin from removing another admin', async () => {
      mockProjectRepo.findOne.mockResolvedValue({
        id: 'proj-1',
        ownerId: 'owner-id',
      });
      mockMemberRepo.findOne.mockResolvedValue({
        id: 'm-other-admin',
        userId: 'other-admin',
        role: ProjectRole.ADMIN,
      });
      accessService.assertCan.mockResolvedValue(ProjectRole.ADMIN);

      await expect(
        service.removeMember('admin-id', 'proj-1', 'other-admin'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should allow owner to remove any member', async () => {
      mockProjectRepo.findOne.mockResolvedValue({
        id: 'proj-1',
        ownerId: 'owner-id',
      });
      mockMemberRepo.findOne.mockResolvedValue({
        id: 'm-target',
        userId: 'target-id',
        role: ProjectRole.ADMIN,
      });
      accessService.assertCan.mockResolvedValue(ProjectRole.OWNER);

      await service.removeMember('owner-id', 'proj-1', 'target-id');

      expect(accessService.assertCan).toHaveBeenCalledWith(
        'owner-id',
        'proj-1',
        'member:manage',
      );
      expect(mockMemberRepo.delete).toHaveBeenCalledWith({ id: 'm-target' });
    });
  });

  describe('createInvitation', () => {
    it('should reject inviting to default inbox project', async () => {
      accessService.assertCan.mockResolvedValue(ProjectRole.OWNER);
      mockUserRepo.findOne.mockResolvedValue({
        id: 'owner-id',
        defaultProjectId: 'proj-inbox',
      });

      await expect(
        service.createInvitation('owner-id', 'proj-inbox', {
          email: 'collab@example.com',
          role: ProjectRole.EDITOR,
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('should prevent admin from inviting an admin', async () => {
      accessService.assertCan.mockResolvedValue(ProjectRole.ADMIN);
      mockUserRepo.findOne.mockResolvedValue(null);

      await expect(
        service.createInvitation('admin-id', 'proj-1', {
          email: 'collab@example.com',
          role: ProjectRole.ADMIN,
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should reject invitation if user is already a member', async () => {
      accessService.assertCan.mockResolvedValue(ProjectRole.OWNER);
      mockUserRepo.findOne
        .mockResolvedValueOnce(null) // defaultProjectId check
        .mockResolvedValueOnce({
          id: 'existing-u',
          email: 'collab@example.com',
        });
      mockMemberRepo.findOne.mockResolvedValue({
        id: 'm-exist',
      });

      await expect(
        service.createInvitation('owner-id', 'proj-1', {
          email: 'collab@example.com',
          role: ProjectRole.EDITOR,
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('should create and return invitation with raw token', async () => {
      accessService.assertCan.mockResolvedValue(ProjectRole.OWNER);
      mockUserRepo.findOne.mockResolvedValue(null); // not inbox, user doesn't exist yet
      mockInvitationRepo.findOne.mockResolvedValue(null); // no existing pending
      mockInvitationRepo.create.mockImplementation(
        (dto) => dto as ProjectInvitation,
      );
      mockInvitationRepo.save.mockImplementation(
        (inv) =>
          ({
            id: 'inv-1',
            ...inv,
          }) as ProjectInvitation,
      );

      const result = await service.createInvitation('owner-id', 'proj-1', {
        email: 'collab@example.com',
        role: ProjectRole.EDITOR,
      });

      expect(result.token).toBeDefined();
      expect(result.token.length).toBe(64); // 32 bytes hex
      expect(result.invitation.role).toBe(ProjectRole.EDITOR);
      expect(result.invitation.tokenHash).toBe(
        crypto.createHash('sha256').update(result.token).digest('hex'),
      );
    });
  });

  describe('revokeInvitation', () => {
    it('should set status to REVOKED', async () => {
      accessService.assertCan.mockResolvedValue(ProjectRole.ADMIN);
      const inv = {
        id: 'inv-1',
        status: ProjectInvitationStatus.PENDING,
      } as ProjectInvitation;
      mockInvitationRepo.findOne.mockResolvedValue(inv);

      await service.revokeInvitation('admin-id', 'proj-1', 'inv-1');

      expect(inv.status).toBe(ProjectInvitationStatus.REVOKED);
      expect(mockInvitationRepo.save).toHaveBeenCalledWith(inv);
    });

    it('should throw NotFoundException if invitation does not exist', async () => {
      accessService.assertCan.mockResolvedValue(ProjectRole.ADMIN);
      mockInvitationRepo.findOne.mockResolvedValue(null);

      await expect(
        service.revokeInvitation('admin-id', 'proj-1', 'inv-nonexistent'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('acceptInvitation', () => {
    const rawToken = 'test-token-123';

    it('should throw NotFoundException if tokenHash not found or not pending', async () => {
      mockInvitationRepo.findOne.mockResolvedValue(null);

      await expect(
        service.acceptInvitation('user-id', { token: rawToken }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException and expire invitation if past expiresAt', async () => {
      const expiredInv = {
        id: 'inv-1',
        expiresAt: new Date(Date.now() - 10000),
        status: ProjectInvitationStatus.PENDING,
      } as ProjectInvitation;
      mockInvitationRepo.findOne.mockResolvedValue(expiredInv);

      await expect(
        service.acceptInvitation('user-id', { token: rawToken }),
      ).rejects.toThrow(BadRequestException);

      expect(expiredInv.status).toBe(ProjectInvitationStatus.EXPIRED);
      expect(mockInvitationRepo.save).toHaveBeenCalledWith(expiredInv);
    });

    it('should throw ForbiddenException if accepting user email does not match invitedEmail', async () => {
      const validInv = {
        id: 'inv-1',
        invitedEmail: 'invited@example.com',
        expiresAt: new Date(Date.now() + 100000),
        status: ProjectInvitationStatus.PENDING,
      } as ProjectInvitation;
      mockInvitationRepo.findOne.mockResolvedValue(validInv);
      mockUserRepo.findOne.mockResolvedValue({
        id: 'user-id',
        email: 'wrong-user@example.com',
      });

      await expect(
        service.acceptInvitation('user-id', { token: rawToken }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should accept invitation and insert ProjectMember atomically in transaction', async () => {
      const validInv = {
        id: 'inv-1',
        projectId: 'proj-1',
        invitedEmail: 'invited@example.com',
        role: ProjectRole.EDITOR,
        expiresAt: new Date(Date.now() + 100000),
        status: ProjectInvitationStatus.PENDING,
      } as ProjectInvitation;
      mockInvitationRepo.findOne.mockResolvedValue(validInv);
      mockUserRepo.findOne.mockResolvedValue({
        id: 'user-id',
        email: 'invited@example.com',
      });
      mockTransactionManager.findOne.mockResolvedValue(null);
      mockTransactionManager.create.mockImplementation((_, data) => data);

      const result = await service.acceptInvitation('user-id', {
        token: rawToken,
      });

      expect(result).toEqual({
        projectId: 'proj-1',
        role: ProjectRole.EDITOR,
      });
      expect(validInv.status).toBe(ProjectInvitationStatus.ACCEPTED);
      expect(mockTransactionManager.save).toHaveBeenCalledTimes(2); // save inv & save member
    });
  });
});
