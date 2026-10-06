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

  @Get(':hexCode')
  async getColorByHexCode(
    @CurrentUser() user: JwtUser,
    @Param('hexCode') hexCode: string,
  ) {
    return this.colorService.getColorByHexCode(user.id, hexCode);
  }

  @Patch(':hexCode')
  async updateColor(
    @CurrentUser() user: JwtUser,
    @Param('hexCode') hexCode: string,
    @Body() dto: UpdateColorDto,
  ) {
    return this.colorService.updateColor(user.id, hexCode, dto);
  }

  @Delete(':hexCode')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteColor(
    @CurrentUser() user: JwtUser,
    @Param('hexCode') hexCode: string,
  ) {
    await this.colorService.deleteColor(user.id, hexCode);
  }
}
