import {
  Controller,
  Get,
  Param,
} from '@nestjs/common';
import { ColorService } from './color.service';

@Controller('colors')
export class ColorController {
  constructor(private readonly colorService: ColorService) {}

  @Get()
  async getColors() {
    return this.colorService.getColors();
  }

  @Get(':key')
  async getColorByKey(@Param('key') key: string) {
    return this.colorService.getColorByKey(key);
  }
}
