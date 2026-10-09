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

export const DEFAULT_PALETTE_COLORS = [
  { key: 'slate', name: 'Slate' },
  { key: 'red', name: 'Red' },
  { key: 'amber', name: 'Amber' },
  { key: 'emerald', name: 'Emerald' },
  { key: 'sky', name: 'Sky Blue' },
  { key: 'indigo', name: 'Indigo' },
  { key: 'violet', name: 'Violet' },
] as const;

@Injectable()
export class ColorService {
  constructor(
    @InjectRepository(Color)
    private readonly colorRepository: Repository<Color>,
  ) {}

  async ensureDefaultColors(ownerId: string): Promise<Color[]> {
    const existing = await this.colorRepository.find({ where: { ownerId } });
    const existingKeys = new Set(existing.map((c) => c.key));

    const toCreate = DEFAULT_PALETTE_COLORS.filter(
      (dc) => !existingKeys.has(dc.key),
    ).map((dc) =>
      this.colorRepository.create({
        ownerId,
        key: dc.key,
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
    const key = createColorDto.key.toLowerCase().trim();
    const existing = await this.colorRepository.findOne({
      where: { ownerId, key },
    });

    if (existing) {
      throw new ConflictException(
        `Color with palette key '${key}' already exists`,
      );
    }

    const color = this.colorRepository.create({
      ownerId,
      key,
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

  async getColorByKey(ownerId: string, rawKey: string): Promise<Color> {
    const key = rawKey.toLowerCase().trim();
    const color = await this.colorRepository.findOne({
      where: { ownerId, key },
    });

    if (!color) {
      throw new NotFoundException(`Color with palette key '${key}' not found`);
    }

    return color;
  }

  async updateColor(
    ownerId: string,
    rawKey: string,
    updateColorDto: UpdateColorDto,
  ): Promise<Color> {
    const color = await this.getColorByKey(ownerId, rawKey);
    color.name = updateColorDto.name.trim();
    return this.colorRepository.save(color);
  }

  async deleteColor(ownerId: string, rawKey: string): Promise<void> {
    const key = rawKey.toLowerCase().trim();
    const result = await this.colorRepository.delete({ ownerId, key });

    if (result.affected === 0) {
      throw new NotFoundException(`Color with palette key '${key}' not found`);
    }
  }
}
