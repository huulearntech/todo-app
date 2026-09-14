import { Body, Controller, Post, Req } from "@nestjs/common";
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
}