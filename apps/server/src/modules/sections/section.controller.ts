import { Body, Controller, Param, Patch, Post, Req } from "@nestjs/common";
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

    return this.sectionService.createSection(userId, body);
  }


  @Patch(":id/reorder")
  async updateTask(
    @Req() req: Request & { user: { id: string } }, // TODO: Factor this out
    @Param("id") id: string,
    @Body("prevId") prevId?: string,
    @Body("nextId") nextId?: string
  ) {
    await this.sectionService.updateSectionOrder(req.user.id, id, prevId, nextId);
  }
}