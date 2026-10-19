import { SetMetadata } from '@nestjs/common';
import { ProjectAction } from '../project-permissions';

export const PROJECT_ACTION_KEY = 'project_action';

export const RequireProjectAction = (action: ProjectAction) =>
  SetMetadata(PROJECT_ACTION_KEY, action);
