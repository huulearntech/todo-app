import { Body, Controller, Get, Param, Patch, Post, Req } from "@nestjs/common";
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
  async updateSection(
    @Req() req: Request & { user: { id: string } }, // TODO: Factor this out
    @Param("id") id: string,
    @Body("prevId") prevId: string | null,
  ) {
    // TODO: verify user has permission to reorder sections in this project.
    await this.sectionService.updateSectionOrder({
      sectionId: id,
      prevId
    });
  }
}