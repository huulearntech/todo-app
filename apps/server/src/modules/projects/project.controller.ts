import { Body, Controller, Post, Get, Query, Param } from "@nestjs/common";
import { ProjectService } from "./project.service";
import { CreateProjectDto } from "./dto/create-project.dto";
import { TaskService } from "../tasks/task.service";
import { Dto_Filter_GetTasks } from "../tasks/dto/get-my-tasks.dto";
import { SectionService } from "../sections/section.service";
import { CurrentUser, type JwtUser } from "../auth/decorators/current-user.decorator";


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
    @Body() body: CreateProjectDto
  ) {
    return this.projectService.createProject(user.id, body);
  }

  @Get("me")
  async getMyProjects(
    @CurrentUser() user: JwtUser,
    @Query() filter?: { // TODO: type of filter
      name?: string;
      isDefault?: boolean;
    }
  ) {
    return this.projectService.getProjectsByOwnerIdAndFilter(user.id, filter);
  }

  @Get(":id")
  async getProjectById(@Param("id") id: string) {
    return this.projectService.getProjectById(id);
  }

  @Get(":id/tasks")
  async getTasksByProjectId(
    @CurrentUser() user: JwtUser,
    @Param("id") projectId: string,
    @Query() filter: Dto_Filter_GetTasks = {}
  ) {
    return this.taskService.getTasksByOwnerIdProjectIdAndFilter(user.id, projectId, filter);
  }


  @Get(":id/sections")
  async getSectionsByProjectId(@Param("id") projectId: string) {
    // TODO: verify user.
    return this.sectionService.getSectionsIdAndNameByProjectId(projectId);
  }
}