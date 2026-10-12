import {
  Body,
  Controller,
  Delete,
  NotFoundException,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { SectionService } from './section.service';
import { CreateSectionDto, UpdateSectionDto } from './dto/create-section.dto';
import {
  CurrentUser,
  type JwtUser,
} from '../auth/decorators/current-user.decorator';

@Controller('sections')
export class SectionController {
  constructor(private readonly sectionService: SectionService) {}

  @Post()
  async createSection(
    @CurrentUser() user: JwtUser,
    @Body() body: CreateSectionDto,
  ) {
    return this.sectionService.createSection(user.id, body);
  }

  @Patch(':id/reorder')
  async updateSectionOrder(
    @CurrentUser() user: JwtUser,
    @Param('id') id: string,
    @Body('prevId') prevId: string | null,
  ) {
    await this.sectionService.updateSectionOrder({
      ownerId: user.id,
      id,
      prevId,
    });
  }

  @Patch(':id')
  async updateSection(
    @CurrentUser() user: JwtUser,
    @Param('id') id: string,
    @Body() body: UpdateSectionDto,
  ) {
    const updated = await this.sectionService.updateSection(user.id, id, body);
    if (!updated) {
      throw new NotFoundException('Section not found');
    }
    return updated;
  }

  @Delete(':id')
  async deleteSection(@CurrentUser() user: JwtUser, @Param('id') id: string) {
    const deleted = await this.sectionService.deleteSection(user.id, id);
    if (!deleted) {
      throw new NotFoundException('Section not found');
    }
    return { success: true };
  }
}
