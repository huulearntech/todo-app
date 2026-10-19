import { Test, TestingModule } from '@nestjs/testing';
import { ProjectMemberController } from './project-member.controller';
import { ProjectMemberService } from './project-member.service';
import { ProjectRole } from '@todo/shared';
import { JwtUser } from '../auth/decorators/current-user.decorator';

describe('ProjectMemberController', () => {
  let controller: ProjectMemberController;
  let service: jest.Mocked<ProjectMemberService>;

  const mockUser: JwtUser = {
    id: 'user-1',
  };

  const mockService = {
    getMembers: jest.fn(),
    updateMemberRole: jest.fn(),
    removeMember: jest.fn(),
    createInvitation: jest.fn(),
    getPendingInvitations: jest.fn(),
    revokeInvitation: jest.fn(),
    acceptInvitation: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProjectMemberController],
      providers: [
        {
          provide: ProjectMemberService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<ProjectMemberController>(ProjectMemberController);
    service = module.get(ProjectMemberService);
  });

  describe('getMembers', () => {
    it('should delegate to service.getMembers', async () => {
      mockService.getMembers.mockResolvedValue([]);
      const result = await controller.getMembers(mockUser, 'proj-1');
      expect(service.getMembers).toHaveBeenCalledWith('user-1', 'proj-1');
      expect(result).toEqual([]);
    });
  });

  describe('updateMemberRole', () => {
    it('should delegate to service.updateMemberRole', async () => {
      const dto = { role: ProjectRole.ADMIN as const };
      mockService.updateMemberRole.mockResolvedValue({
        role: ProjectRole.ADMIN,
      });

      const result = await controller.updateMemberRole(
        mockUser,
        'proj-1',
        'user-2',
        dto,
      );
      expect(service.updateMemberRole).toHaveBeenCalledWith(
        'user-1',
        'proj-1',
        'user-2',
        dto,
      );
      expect(result).toEqual({ role: ProjectRole.ADMIN });
    });
  });

  describe('removeMember', () => {
    it('should delegate to service.removeMember', async () => {
      await controller.removeMember(mockUser, 'proj-1', 'user-2');
      expect(service.removeMember).toHaveBeenCalledWith(
        'user-1',
        'proj-1',
        'user-2',
      );
    });
  });

  describe('createInvitation', () => {
    it('should delegate to service.createInvitation', async () => {
      const dto = {
        email: 'invite@example.com',
        role: ProjectRole.EDITOR as const,
      };
      mockService.createInvitation.mockResolvedValue({ token: 'tok' } as any);

      const result = await controller.createInvitation(mockUser, 'proj-1', dto);
      expect(service.createInvitation).toHaveBeenCalledWith(
        'user-1',
        'proj-1',
        dto,
      );
      expect(result).toEqual({ token: 'tok' });
    });
  });

  describe('getPendingInvitations', () => {
    it('should delegate to service.getPendingInvitations', async () => {
      mockService.getPendingInvitations.mockResolvedValue([]);
      const result = await controller.getPendingInvitations(mockUser, 'proj-1');
      expect(service.getPendingInvitations).toHaveBeenCalledWith(
        'user-1',
        'proj-1',
      );
      expect(result).toEqual([]);
    });
  });

  describe('revokeInvitation', () => {
    it('should delegate to service.revokeInvitation', async () => {
      await controller.revokeInvitation(mockUser, 'proj-1', 'inv-1');
      expect(service.revokeInvitation).toHaveBeenCalledWith(
        'user-1',
        'proj-1',
        'inv-1',
      );
    });
  });

  describe('acceptInvitation', () => {
    it('should delegate to service.acceptInvitation', async () => {
      const dto = { token: 'raw-tok' };
      mockService.acceptInvitation.mockResolvedValue({
        projectId: 'proj-1',
        role: ProjectRole.EDITOR,
      });

      const result = await controller.acceptInvitation(mockUser, dto);
      expect(service.acceptInvitation).toHaveBeenCalledWith('user-1', dto);
      expect(result).toEqual({
        projectId: 'proj-1',
        role: ProjectRole.EDITOR,
      });
    });
  });
});
