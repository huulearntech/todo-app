import { Injectable, NotFoundException } from '@nestjs/common';
import {
  PALETTE_COLORS,
  type PaletteColor,
  type ColorResponseDto,
} from '@todo/shared';

export type StaticColor = ColorResponseDto;

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
  resolveColor(
    rawKey?: string | null,
    fallback: PaletteColor = 'slate',
  ): PaletteColor {
    return ColorService.resolveColor(rawKey, fallback);
  }

  static resolveColor(
    rawKey?: string | null,
    fallback: PaletteColor = 'slate',
  ): PaletteColor {
    if (!rawKey) return fallback;
    const key = rawKey.toLowerCase().trim() as PaletteColor;
    return (PALETTE_COLORS as readonly string[]).includes(key) ? key : fallback;
  }

  async getColors(): Promise<ColorResponseDto[]> {
    return PALETTE_COLORS.map((key) => ({
      key,
      name: COLOR_NAMES[key] || key.charAt(0).toUpperCase() + key.slice(1),
    }));
  }

  async getMyColors(_ownerId?: string): Promise<ColorResponseDto[]> {
    return this.getColors();
  }

  async getColorByKey(rawKey: string): Promise<ColorResponseDto> {
    const key = rawKey.toLowerCase().trim() as PaletteColor;
    if (!PALETTE_COLORS.includes(key)) {
      throw new NotFoundException(`Color with palette key '${key}' not found`);
    }

    return {
      key,
      name: COLOR_NAMES[key] || key.charAt(0).toUpperCase() + key.slice(1),
    };
  }
}
