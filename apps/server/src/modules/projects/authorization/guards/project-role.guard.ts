import {
  Injectable,
  CanActivate,
  ExecutionContext,
  BadRequestException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ProjectRole } from '@todo/shared';
import { PROJECT_ACTION_KEY } from '../decorators/project-action.decorator';
import { ProjectAction } from '../project-permissions';
import { ProjectAccessService } from '../project-access.service';

export interface ProjectRoleRequest {
  user?: { id: string };
  params?: Record<string, string | undefined>;
  body?: Record<string, unknown>;
  projectRole?: ProjectRole;
}

@Injectable()
export class ProjectRoleGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly projectAccessService: ProjectAccessService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredAction = this.reflector.getAllAndOverride<ProjectAction>(
      PROJECT_ACTION_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredAction) {
      return true;
    }

    const request = context.switchToHttp().getRequest<ProjectRoleRequest>();
    const user = request.user;
    if (!user?.id) {
      return false;
    }

    const projectIdParam = request.params?.projectId || request.params?.id;
    const projectIdBody =
      typeof request.body?.projectId === 'string'
        ? request.body.projectId
        : undefined;
    const projectId = projectIdParam || projectIdBody;

    if (!projectId) {
      throw new BadRequestException(
        'Project ID parameter is required for authorization',
      );
    }

    const role = await this.projectAccessService.assertCan(
      user.id,
      projectId,
      requiredAction,
    );

    request.projectRole = role;
    return true;
  }
}
