import { Body, Controller, Post, Req } from "@nestjs/common";
import { SectionService } from "./section.service";
import { CreateSectionDto } from "./dto/create-section.dto";


@Controller('sections')
export class SectionController {
  constructor(private readonly sectionService: SectionService) {}

  @Post()
  async createSection(
    @Req() request: Request & { user: { id: string } },
    @Body() body: CreateSectionDto
  ) {
    const userId = request.user.id;
    const { projectId, name, description } = body;

    return this.sectionService.createSection({
      ownerId: userId,
      projectId,
      name,
      description,
    });
  }
}