import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PALETTE_COLORS, type PaletteColor } from '@todo/shared';
import { CreateColorDto } from './dto/create-color.dto';
import { UpdateColorDto } from './dto/update-color.dto';

export interface StaticColor {
  ownerId: string;
  key: PaletteColor;
  name: string;
}

const COLOR_NAMES: Record<PaletteColor, string> = {
  slate: 'Slate',
  gray: 'Gray',
  red: 'Red',
  orange: 'Orange',
  amber: 'Amber',
  yellow: 'Yellow',
  lime: 'Lime',
  green: 'Green',
  emerald: 'Emerald',
  teal: 'Teal',
  cyan: 'Cyan',
  sky: 'Sky Blue',
  blue: 'Blue',
  indigo: 'Indigo',
  violet: 'Violet',
  purple: 'Purple',
  fuchsia: 'Fuchsia',
  pink: 'Pink',
  rose: 'Rose',
};

@Injectable()
export class ColorService {
  async ensureDefaultColors(ownerId: string): Promise<StaticColor[]> {
    return this.getMyColors(ownerId);
  }

  async getMyColors(ownerId: string): Promise<StaticColor[]> {
    return PALETTE_COLORS.map((key) => ({
      ownerId,
      key,
      name: COLOR_NAMES[key] || key.charAt(0).toUpperCase() + key.slice(1),
    }));
  }

  async getColorByKey(ownerId: string, rawKey: string): Promise<StaticColor> {
    const key = rawKey.toLowerCase().trim() as PaletteColor;
    if (!PALETTE_COLORS.includes(key)) {
      throw new NotFoundException(`Color with palette key '${key}' not found`);
    }

    return {
      ownerId,
      key,
      name: COLOR_NAMES[key] || key.charAt(0).toUpperCase() + key.slice(1),
    };
  }

  async createColor(
    _ownerId: string,
    _createColorDto: CreateColorDto,
  ): Promise<StaticColor> {
    throw new BadRequestException(
      'Color palette is fixed system-wide and cannot be customized.',
    );
  }

  async updateColor(
    _ownerId: string,
    _rawKey: string,
    _updateColorDto: UpdateColorDto,
  ): Promise<StaticColor> {
    throw new BadRequestException(
      'Color palette is fixed system-wide and cannot be customized.',
    );
  }

  async deleteColor(_ownerId: string, _rawKey: string): Promise<void> {
    throw new BadRequestException(
      'Color palette is fixed system-wide and cannot be customized.',
    );
  }
}
