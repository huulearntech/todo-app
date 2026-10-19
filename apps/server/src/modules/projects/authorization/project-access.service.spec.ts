import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { ProjectAccessService } from './project-access.service';
import { ProjectMember } from '../entities/project-member.entity';
import { ProjectRole } from '@todo/shared';

describe('ProjectAccessService', () => {
  let service: ProjectAccessService;
  let memberRepository: jest.Mocked<Repository<ProjectMember>>;

  const mockMemberRepo = {
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProjectAccessService,
        {
          provide: getRepositoryToken(ProjectMember),
          useValue: mockMemberRepo,
        },
      ],
    }).compile();

    service = module.get<ProjectAccessService>(ProjectAccessService);
    memberRepository = module.get(getRepositoryToken(ProjectMember));
  });

  describe('getRole', () => {
    it('should return member role if user is a member of the project', async () => {
      memberRepository.findOne.mockResolvedValue({
        role: ProjectRole.ADMIN,
      } as ProjectMember);

      const role = await service.getRole('user-1', 'proj-1');

      expect(role).toBe(ProjectRole.ADMIN);
      expect(mockMemberRepo.findOne).toHaveBeenCalledWith({
        where: { projectId: 'proj-1', userId: 'user-1' },
        select: { role: true },
      });
    });

    it('should return null if user is not a member', async () => {
      memberRepository.findOne.mockResolvedValue(null);

      const role = await service.getRole('user-1', 'proj-1');

      expect(role).toBeNull();
    });
  });

  describe('assertCan', () => {
    it('should throw NotFoundException (404) if user is not a member to conceal project existence', async () => {
      memberRepository.findOne.mockResolvedValue(null);

      await expect(
        service.assertCan('user-stranger', 'proj-1', 'project:read'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException (403) if member lacks permission for action', async () => {
      memberRepository.findOne.mockResolvedValue({
        role: ProjectRole.VIEWER,
      } as ProjectMember);

      await expect(
        service.assertCan('user-viewer', 'proj-1', 'task:create'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should return role when member has required permission', async () => {
      memberRepository.findOne.mockResolvedValue({
        role: ProjectRole.EDITOR,
      } as ProjectMember);

      const role = await service.assertCan(
        'user-editor',
        'proj-1',
        'task:create',
      );
      expect(role).toBe(ProjectRole.EDITOR);
    });

    it('should allow owner to perform owner-restricted actions', async () => {
      memberRepository.findOne.mockResolvedValue({
        role: ProjectRole.OWNER,
      } as ProjectMember);

      const role = await service.assertCan(
        'user-owner',
        'proj-1',
        'project:delete',
      );
      expect(role).toBe(ProjectRole.OWNER);
    });
  });

  describe('applyMembershipScope', () => {
    it('should apply innerJoin with ProjectMember to scope query', () => {
      const innerJoinMock = jest.fn().mockReturnThis();
      const qb = {
        innerJoin: innerJoinMock,
      } as unknown as SelectQueryBuilder<any>;

      const result = service.applyMembershipScope(
        qb,
        'project',
        'user-1',
        'pm_scope',
      );

      expect(innerJoinMock).toHaveBeenCalledWith(
        ProjectMember,
        'pm_scope',
        'pm_scope.projectId = project.id AND pm_scope.userId = :accessUserId',
        { accessUserId: 'user-1' },
      );
      expect(result).toBe(qb);
    });
  });
});
