import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { ColorService } from './color.service';
import { CreateColorDto } from './dto/create-color.dto';
import { UpdateColorDto } from './dto/update-color.dto';
import {
  CurrentUser,
  type JwtUser,
} from '../auth/decorators/current-user.decorator';

@Controller('colors')
export class ColorController {
  constructor(private readonly colorService: ColorService) {}

  @Post()
  async createColor(@CurrentUser() user: JwtUser, @Body() dto: CreateColorDto) {
    return this.colorService.createColor(user.id, dto);
  }

  @Get()
  async getMyColors(@CurrentUser() user: JwtUser) {
    return this.colorService.getMyColors(user.id);
  }

  @Get('me')
  async getMyColorsAlias(@CurrentUser() user: JwtUser) {
    return this.colorService.getMyColors(user.id);
  }

  @Get(':key')
  async getColorByKey(@CurrentUser() user: JwtUser, @Param('key') key: string) {
    return this.colorService.getColorByKey(user.id, key);
  }

  @Patch(':key')
  async updateColor(
    @CurrentUser() user: JwtUser,
    @Param('key') key: string,
    @Body() dto: UpdateColorDto,
  ) {
    return this.colorService.updateColor(user.id, key, dto);
  }

  @Delete(':key')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteColor(@CurrentUser() user: JwtUser, @Param('key') key: string) {
    await this.colorService.deleteColor(user.id, key);
  }
}
