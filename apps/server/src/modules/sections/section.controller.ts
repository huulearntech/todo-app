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
    @Body("prevId") prevId?: string,
    @Body("nextId") nextId?: string
  ) {
    // FIX: Fix temporary hardcoded just for test
    await this.sectionService.updateSectionOrder("9da6157d-8d63-4470-bcdd-f2b5c9064b10", id, prevId, nextId);
  }

  // TODO: @Cleanup @Temporary
  @Get("project/:projectId")
  async getSectionsByProjectId(
    @Req() req: Request & { user: { id: string } },
    @Param("projectId") projectId: string
  ) {
    // TODO: verify user.
    return this.sectionService.getSectionsIdAndNameByProjectId(projectId);
  }
}