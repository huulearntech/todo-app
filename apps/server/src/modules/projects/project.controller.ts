import { Body, Controller, Post, Get, Req, Query, Param } from "@nestjs/common";
import { ProjectService } from "./project.service";
import { CreateProjectDto } from "./dto/create-project.dto";


@Controller('projects')
export class ProjectController {
  constructor(private readonly projectService: ProjectService) {}

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
}