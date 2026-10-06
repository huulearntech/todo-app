import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { ColorService } from './color.service';
import { Color } from './color.entity';

describe('ColorService', () => {
  let service: ColorService;
  let repository: {
    findOne: jest.Mock;
    find: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
    delete: jest.Mock;
  };

  const ownerId = '11111111-1111-1111-1111-111111111111';

  beforeEach(async () => {
    repository = {
      findOne: jest.fn(),
      find: jest.fn(),
      create: jest.fn((entity: Partial<Color>) => entity as Color),
      save: jest.fn((entity: Partial<Color>) =>
        Promise.resolve(entity as Color),
      ),
      delete: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ColorService,
        {
          provide: getRepositoryToken(Color),
          useValue: repository,
        },
      ],
    }).compile();

    service = module.get<ColorService>(ColorService);
  });

  describe('createColor', () => {
    it('should create and return a new color normalized to uppercase hex', async () => {
      repository.findOne.mockResolvedValue(null);

      const dto = { hexCode: '#3b82f6', name: 'Sky Blue' };
      const result = await service.createColor(ownerId, dto);

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { ownerId, hexCode: '#3B82F6' },
      });
      expect(repository.create).toHaveBeenCalledWith({
        ownerId,
        hexCode: '#3B82F6',
        name: 'Sky Blue',
      });
      expect(result).toEqual({
        ownerId,
        hexCode: '#3B82F6',
        name: 'Sky Blue',
      });
    });

    it('should throw ConflictException if color hex code already exists for user', async () => {
      repository.findOne.mockResolvedValue({
        ownerId,
        hexCode: '#3B82F6',
        name: 'Existing Blue',
      });

      const dto = { hexCode: '#3b82f6', name: 'Duplicate Blue' };
      await expect(service.createColor(ownerId, dto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('getMyColors', () => {
    it('should return all colors for ownerId ordered by name', async () => {
      const mockColors = [
        { ownerId, hexCode: '#000000', name: 'Black' },
        { ownerId, hexCode: '#FFFFFF', name: 'White' },
      ];
      repository.find.mockResolvedValue(mockColors);

      const result = await service.getMyColors(ownerId);

      expect(repository.find).toHaveBeenCalledWith({
        where: { ownerId },
        order: { name: 'ASC' },
      });
      expect(result).toEqual(mockColors);
    });

    it('should call ensureDefaultColors if user has no colors', async () => {
      repository.find
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([{ ownerId, hexCode: '#E0E0E0', name: 'Grey' }]);
      repository.save.mockResolvedValue([]);

      const result = await service.getMyColors(ownerId);

      expect(repository.create).toHaveBeenCalled();
      expect(result).toEqual([{ ownerId, hexCode: '#E0E0E0', name: 'Grey' }]);
    });
  });

  describe('getColorByHexCode', () => {
    it('should return the color if found', async () => {
      const mockColor = { ownerId, hexCode: '#FF0000', name: 'Red' };
      repository.findOne.mockResolvedValue(mockColor);

      const result = await service.getColorByHexCode(ownerId, '%23FF0000');

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { ownerId, hexCode: '#FF0000' },
      });
      expect(result).toEqual(mockColor);
    });

    it('should throw NotFoundException if color is not found', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(
        service.getColorByHexCode(ownerId, '#123456'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateColor', () => {
    it('should update color name and return saved entity', async () => {
      const mockColor = { ownerId, hexCode: '#FF0000', name: 'Red' };
      repository.findOne.mockResolvedValue(mockColor);

      const result = await service.updateColor(ownerId, '#ff0000', {
        name: 'Crimson',
      });

      expect(result.name).toBe('Crimson');
      expect(repository.save).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'Crimson' }),
      );
    });
  });

  describe('deleteColor', () => {
    it('should delete color when exists', async () => {
      repository.delete.mockResolvedValue({ affected: 1, raw: [] });

      await service.deleteColor(ownerId, 'ff0000');

      expect(repository.delete).toHaveBeenCalledWith({
        ownerId,
        hexCode: '#FF0000',
      });
    });

    it('should throw NotFoundException when no row was deleted', async () => {
      repository.delete.mockResolvedValue({ affected: 0, raw: [] });

      await expect(service.deleteColor(ownerId, '#ff0000')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
