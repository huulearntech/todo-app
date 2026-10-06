import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Color } from './color.entity';
import { CreateColorDto } from './dto/create-color.dto';
import { UpdateColorDto } from './dto/update-color.dto';

export const DEFAULT_COLORS = [
  { hexCode: '#E0E0E0', name: 'Grey' },
  { hexCode: '#EF4444', name: 'Red' },
  { hexCode: '#F59E0B', name: 'Amber' },
  { hexCode: '#10B981', name: 'Emerald' },
  { hexCode: '#3B82F6', name: 'Blue' },
  { hexCode: '#8B5CF6', name: 'Purple' },
] as const;

export function normalizeHexCode(rawHex: string): string {
  const decoded = decodeURIComponent(rawHex).trim();
  const prefixed = decoded.startsWith('#') ? decoded : `#${decoded}`;
  return prefixed.toUpperCase();
}

@Injectable()
export class ColorService {
  constructor(
    @InjectRepository(Color)
    private readonly colorRepository: Repository<Color>,
  ) {}

  async ensureDefaultColors(ownerId: string): Promise<Color[]> {
    const existing = await this.colorRepository.find({ where: { ownerId } });
    const existingHexes = new Set(existing.map((c) => c.hexCode));

    const toCreate = DEFAULT_COLORS.filter(
      (dc) => !existingHexes.has(dc.hexCode),
    ).map((dc) =>
      this.colorRepository.create({
        ownerId,
        hexCode: dc.hexCode,
        name: dc.name,
      }),
    );

    if (toCreate.length > 0) {
      await this.colorRepository.save(toCreate);
    }

    return this.colorRepository.find({
      where: { ownerId },
      order: { name: 'ASC' },
    });
  }

  async createColor(
    ownerId: string,
    createColorDto: CreateColorDto,
  ): Promise<Color> {
    const hexCode = normalizeHexCode(createColorDto.hexCode);
    const existing = await this.colorRepository.findOne({
      where: { ownerId, hexCode },
    });

    if (existing) {
      throw new ConflictException(
        `Color with hex code ${hexCode} already exists`,
      );
    }

    const color = this.colorRepository.create({
      ownerId,
      hexCode,
      name: createColorDto.name.trim(),
    });

    return this.colorRepository.save(color);
  }

  async getMyColors(ownerId: string): Promise<Color[]> {
    const colors = await this.colorRepository.find({
      where: { ownerId },
      order: { name: 'ASC' },
    });

    if (colors.length === 0) {
      return this.ensureDefaultColors(ownerId);
    }

    return colors;
  }

  async getColorByHexCode(ownerId: string, rawHex: string): Promise<Color> {
    const hexCode = normalizeHexCode(rawHex);
    const color = await this.colorRepository.findOne({
      where: { ownerId, hexCode },
    });

    if (!color) {
      throw new NotFoundException(`Color with hex code ${hexCode} not found`);
    }

    return color;
  }

  async updateColor(
    ownerId: string,
    rawHex: string,
    updateColorDto: UpdateColorDto,
  ): Promise<Color> {
    const color = await this.getColorByHexCode(ownerId, rawHex);
    color.name = updateColorDto.name.trim();
    return this.colorRepository.save(color);
  }

  async deleteColor(ownerId: string, rawHex: string): Promise<void> {
    const hexCode = normalizeHexCode(rawHex);
    const result = await this.colorRepository.delete({ ownerId, hexCode });

    if (result.affected === 0) {
      throw new NotFoundException(`Color with hex code ${hexCode} not found`);
    }
  }
}
