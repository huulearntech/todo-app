import { Reflector } from '@nestjs/core';
import { ExecutionContext, BadRequestException } from '@nestjs/common';
import { ProjectRoleGuard, ProjectRoleRequest } from './project-role.guard';
import { ProjectAccessService } from '../project-access.service';
import { ProjectRole } from '@todo/shared';

describe('ProjectRoleGuard', () => {
  let guard: ProjectRoleGuard;
  let reflector: jest.Mocked<Reflector>;
  let accessService: jest.Mocked<ProjectAccessService>;

  const mockReflector = {
    getAllAndOverride: jest.fn(),
  };

  const mockAccessService = {
    assertCan: jest.fn(),
    getRole: jest.fn(),
    applyMembershipScope: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    reflector = mockReflector as unknown as jest.Mocked<Reflector>;
    accessService =
      mockAccessService as unknown as jest.Mocked<ProjectAccessService>;
    guard = new ProjectRoleGuard(reflector, accessService);
  });

  function createMockContext(
    request: ProjectRoleRequest | { user: null },
  ): ExecutionContext {
    return {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue(request),
      }),
    } as unknown as ExecutionContext;
  }

  it('should allow access if no project action is required', async () => {
    mockReflector.getAllAndOverride.mockReturnValue(undefined);
    const context = createMockContext({});

    const result = await guard.canActivate(context);
    expect(result).toBe(true);
  });

  it('should return false if request has no authenticated user', async () => {
    mockReflector.getAllAndOverride.mockReturnValue('project:read');
    const context = createMockContext({ user: null });

    const result = await guard.canActivate(context);
    expect(result).toBe(false);
  });

  it('should throw BadRequestException if projectId is missing', async () => {
    mockReflector.getAllAndOverride.mockReturnValue('project:read');
    const context = createMockContext({
      user: { id: 'u-1' },
      params: {},
      body: {},
    });

    await expect(guard.canActivate(context)).rejects.toThrow(
      BadRequestException,
    );
  });

  it('should resolve projectId from params and set projectRole on request', async () => {
    mockReflector.getAllAndOverride.mockReturnValue('task:create');
    const req: ProjectRoleRequest = {
      user: { id: 'u-1' },
      params: { projectId: 'p-1' },
    };
    const context = createMockContext(req);
    mockAccessService.assertCan.mockResolvedValue(ProjectRole.EDITOR);

    const result = await guard.canActivate(context);

    expect(result).toBe(true);
    expect(mockAccessService.assertCan).toHaveBeenCalledWith(
      'u-1',
      'p-1',
      'task:create',
    );
    expect(req.projectRole).toBe(ProjectRole.EDITOR);
  });
});
