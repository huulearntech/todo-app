import { Body, Controller, Param, Patch, Post } from "@nestjs/common";
import { SectionService } from "./section.service";
import { CreateSectionDto } from "./dto/create-section.dto";
import { CurrentUser, type JwtUser } from "../auth/decorators/current-user.decorator";


@Controller('sections')
export class SectionController {
  constructor(private readonly sectionService: SectionService) {}

  @Post()
  async createSection(
    @CurrentUser() user: JwtUser,
    @Body() body: CreateSectionDto
  ) {
    return this.sectionService.createSection(user.id, body);
  }


  @Patch(":id/reorder")
  async updateSectionOrder(
    @CurrentUser() user: JwtUser,
    @Param("id") id: string,
    @Body("prevId") prevId: string | null,
  ) {
    await this.sectionService.updateSectionOrder({
      ownerId: user.id,
      id,
      prevId
    });
  }
}