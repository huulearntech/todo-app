import {
  Body,
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { SectionService } from './section.service';
import {
  CreateSectionDto,
  ReorderSectionDto,
  UpdateSectionDto,
} from './dto/create-section.dto';
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
    @Param('id', ParseUUIDPipe) id: string,
    @Body() { prevId }: ReorderSectionDto,
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
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: UpdateSectionDto,
  ) {
    return this.sectionService.updateSection(user.id, id, body);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteSection(
    @CurrentUser() user: JwtUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    await this.sectionService.deleteSection(user.id, id);
  }
}
