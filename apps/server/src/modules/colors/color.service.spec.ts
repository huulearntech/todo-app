import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ColorService } from './color.service';
import { PALETTE_COLORS } from '@todo/shared';

describe('ColorService', () => {
  let service: ColorService;
  const ownerId = '11111111-1111-1111-1111-111111111111';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ColorService],
    }).compile();

    service = module.get<ColorService>(ColorService);
  });

  describe('getMyColors', () => {
    it('should return all system palette colors for ownerId', async () => {
      const colors = await service.getMyColors(ownerId);
      expect(colors.length).toBe(PALETTE_COLORS.length);
      expect(colors[0]).toHaveProperty('ownerId', ownerId);
      expect(colors[0]).toHaveProperty('key');
      expect(colors[0]).toHaveProperty('name');
    });
  });

  describe('getColorByKey', () => {
    it('should return color for valid key case-insensitively', async () => {
      const color = await service.getColorByKey(ownerId, 'RED');
      expect(color).toEqual({
        ownerId,
        key: 'red',
        name: 'Red',
      });
    });

    it('should throw NotFoundException for unknown key', async () => {
      await expect(
        service.getColorByKey(ownerId, 'non-existent-color'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('mutating methods', () => {
    it('createColor should throw BadRequestException', async () => {
      await expect(
        service.createColor(ownerId, { key: 'red' as any, name: 'Red' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('updateColor should throw BadRequestException', async () => {
      await expect(
        service.updateColor(ownerId, 'red', { name: 'Red' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('deleteColor should throw BadRequestException', async () => {
      await expect(service.deleteColor(ownerId, 'red')).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
