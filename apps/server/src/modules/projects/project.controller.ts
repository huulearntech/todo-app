import { Body, Controller, Post, Get, Req, Query, Param } from "@nestjs/common";
import { ProjectService } from "./project.service";
import { CreateProjectDto } from "./dto/create-project.dto";
import { TaskService } from "../tasks/task.service";
import { Dto_Filter_GetTasks } from "../tasks/dto/get-my-tasks.dto";


@Controller('projects')
export class ProjectController {
  constructor(
    private readonly projectService: ProjectService,
    private readonly taskService: TaskService,
  ) {}

  @Post()
  async createProject(
    @Req() request: Request & { user: { id: string } },
    @Body() body: CreateProjectDto
  ) {
    const userId = request.user.id;

    return this.projectService.createProject(userId, body);
  }

  @Get("me")
  async getMyProjects(
    @Req() req: Request & { user: { id: string } },
    @Query() filter?: {
      name?: string;
      isDefault?: boolean;
    }
  ) {
    return this.projectService.getProjectsByOwnerIdAndFilter(req.user.id, filter);
  }

  @Get(":id")
  async getProjectById(@Param("id") id: string) {
    return this.projectService.getProjectById(id);
  }

  @Get(":id/tasks")
  async getTasksByProjectId(
    @Req() req: Request & { user: { id: string } },
    @Param("id") projectId: string,
    @Query() filter: Dto_Filter_GetTasks = {}
  ) {
    return this.taskService.getTasksByOwnerIdProjectIdAndFilter(req.user.id, projectId, filter);
  }
}