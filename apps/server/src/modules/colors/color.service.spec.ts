import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { ColorService } from './color.service';
import { PALETTE_COLORS } from '@todo/shared';

describe('ColorService', () => {
  let service: ColorService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ColorService],
    }).compile();

    service = module.get<ColorService>(ColorService);
  });

  describe('getColors', () => {
    it('should return all system palette colors without ownerId', async () => {
      const colors = await service.getColors();
      expect(colors.length).toBe(PALETTE_COLORS.length);
      expect(colors[0]).not.toHaveProperty('ownerId');
      expect(colors[0]).toHaveProperty('key');
      expect(colors[0]).toHaveProperty('name');
    });
  });

  describe('getColorByKey', () => {
    it('should return color for valid key case-insensitively', async () => {
      const color = await service.getColorByKey('RED');
      expect(color).toEqual({
        key: 'red',
        name: 'Red',
      });
    });

    it('should throw NotFoundException for unknown key', async () => {
      await expect(service.getColorByKey('non-existent-color')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('resolveColor', () => {
    it('should resolve valid palette color', () => {
      expect(ColorService.resolveColor('blue')).toBe('blue');
      expect(service.resolveColor('EMERALD ')).toBe('emerald');
    });

    it('should fallback when key is null or undefined', () => {
      expect(ColorService.resolveColor(null)).toBe('slate');
      expect(ColorService.resolveColor(undefined, 'amber')).toBe('amber');
    });

    it('should fallback when key is not in palette', () => {
      expect(ColorService.resolveColor('unknown-color', 'green')).toBe('green');
    });
  });
});
