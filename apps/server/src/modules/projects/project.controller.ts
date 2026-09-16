import { Body, Controller, Post, Get, Req, Query } from "@nestjs/common";
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
    const { name, description } = body;

    return this.projectService.createProject(userId, name, description);
  }

  @Get("me")
  async getMyProjects(
    @Req() req: Request & { user: { id: string } },
    @Query("name") name?: string
  ) {
    if (!name) {
      return this.projectService.getProjectsByOwnerId(req.user.id);
    }

    return this.projectService.getProjectsByOwnerIdAndName(req.user.id, name);
  }
}