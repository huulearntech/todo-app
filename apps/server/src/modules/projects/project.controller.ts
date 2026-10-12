import {
  Body,
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Query,
  Param,
  ParseUUIDPipe,
  NotFoundException,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ProjectService } from './project.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { TaskService } from '../tasks/services/task.service';
import { TaskFilterDto } from '../tasks/dto/get-my-tasks.dto';
import { SectionService } from '../sections/section.service';
import {
  CurrentUser,
  type JwtUser,
} from '../auth/decorators/current-user.decorator';
import { ProjectFilterDto } from './dto/project-filter.dto';

@Controller('projects')
export class ProjectController {
  constructor(
    private readonly projectService: ProjectService,
    private readonly taskService: TaskService,
    private readonly sectionService: SectionService,
  ) {}

  @Post()
  async createProject(
    @CurrentUser() user: JwtUser,
    @Body() body: CreateProjectDto,
  ) {
    return this.projectService.createProject(user.id, body);
  }

  @Get('me')
  async getMyProjects(
    @CurrentUser() user: JwtUser,
    @Query() filter: ProjectFilterDto = {},
  ) {
    return this.projectService.getProjectsByOwnerIdAndFilter(user.id, filter);
  }

  @Get(':id')
  async getProjectById(
    @CurrentUser() user: JwtUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const project = await this.projectService.getProjectById(id, user.id);
    if (!project) {
      throw new NotFoundException('Project not found');
    }
    return project;
  }

  @Patch(':id')
  async updateProject(
    @CurrentUser() user: JwtUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: UpdateProjectDto,
  ) {
    return this.projectService.updateProject(id, body, user.id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteProject(
    @CurrentUser() user: JwtUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    await this.projectService.deleteProject(id, user.id);
  }

  @Get(':id/tasks')
  async getTasksByProjectId(
    @CurrentUser() user: JwtUser,
    @Param('id', ParseUUIDPipe) projectId: string,
    @Query() filter: TaskFilterDto = {},
  ) {
    if (filter.status === 'completed') {
      return this.taskService.getCompletedOccurrencesByOwnerIdAndFilter(
        user.id,
        { ...filter, projectId },
      );
    }
    return this.taskService.getTasksByOwnerIdProjectIdAndFilter(
      user.id,
      projectId,
      filter,
    );
  }

  @Get(':id/sections')
  async getSectionsByProjectId(
    @CurrentUser() user: JwtUser,
    @Param('id', ParseUUIDPipe) projectId: string,
  ) {
    return this.sectionService.getMySections(user.id, { projectId });
  }
}
