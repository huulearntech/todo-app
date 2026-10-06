import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { TaskLabelService } from './task-label.service';
import { TaskLabel } from './task-label.entity';
import { ColorService } from '../colors/color.service';

describe('TaskLabelService', () => {
  let service: TaskLabelService;
  let labelRepository: {
    find: jest.Mock;
    findOne: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
    delete: jest.Mock;
  };
  let colorService: {
    ensureDefaultColors: jest.Mock;
    getColorByHexCode: jest.Mock;
  };

  const ownerId = '11111111-1111-1111-1111-111111111111';

  beforeEach(async () => {
    labelRepository = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn((entity: Partial<TaskLabel>) => entity as TaskLabel),
      save: jest.fn((entity: Partial<TaskLabel>) =>
        Promise.resolve({ id: 'label-1', ...entity } as TaskLabel),
      ),
      delete: jest.fn(),
    };

    colorService = {
      ensureDefaultColors: jest.fn().mockResolvedValue([]),
      getColorByHexCode: jest.fn().mockResolvedValue({
        ownerId,
        hexCode: '#3B82F6',
        name: 'Blue',
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TaskLabelService,
        {
          provide: getRepositoryToken(TaskLabel),
          useValue: labelRepository,
        },
        {
          provide: ColorService,
          useValue: colorService,
        },
      ],
    }).compile();

    service = module.get<TaskLabelService>(TaskLabelService);
  });

  describe('createTaskLabel', () => {
    it('should create label with default color #E0E0E0 and call ensureDefaultColors', async () => {
      const createdLabel = {
        id: 'label-1',
        ownerId,
        name: 'Work',
        description: 'Work tasks',
        colorHexCode: '#E0E0E0',
      };
      labelRepository.findOne.mockResolvedValue(createdLabel);

      const result = await service.createTaskLabel(ownerId, {
        name: 'Work',
        description: 'Work tasks',
        colorHexCode: '#E0E0E0',
      });

      expect(colorService.ensureDefaultColors).toHaveBeenCalledWith(ownerId);
      expect(labelRepository.create).toHaveBeenCalledWith({
        ownerId,
        name: 'Work',
        description: 'Work tasks',
        colorHexCode: '#E0E0E0',
      });
      expect(result).toEqual(createdLabel);
    });

    it('should create label with custom color after validating via colorService', async () => {
      const targetColor = {
        ownerId,
        hexCode: '#3B82F6',
        name: 'Blue',
      };
      const createdLabel = {
        id: 'label-2',
        ownerId,
        name: 'Urgent',
        colorHexCode: '#3B82F6',
        color: targetColor,
      };
      labelRepository.findOne.mockResolvedValue(createdLabel);

      const result = await service.createTaskLabel(ownerId, {
        name: 'Urgent',
        colorHexCode: '#3b82f6',
      });

      expect(colorService.getColorByHexCode).toHaveBeenCalledWith(
        ownerId,
        '#3B82F6',
      );
      expect(labelRepository.create).toHaveBeenCalledWith({
        ownerId,
        name: 'Urgent',
        description: undefined,
        colorHexCode: '#3B82F6',
        color: targetColor,
      });
      expect(result).toEqual(createdLabel);
    });
  });

  describe('updateTaskLabel', () => {
    it('should update label colorHexCode and color relation entity', async () => {
      const oldColor = {
        ownerId,
        hexCode: '#E0E0E0',
        name: 'Default Gray',
      };
      const newColor = {
        ownerId,
        hexCode: '#3B82F6',
        name: 'Blue',
      };
      const existingLabel = {
        id: 'label-1',
        ownerId,
        name: 'Work',
        colorHexCode: '#E0E0E0',
        color: oldColor,
      };
      labelRepository.findOne
        .mockResolvedValueOnce(existingLabel)
        .mockResolvedValueOnce({
          ...existingLabel,
          colorHexCode: '#3B82F6',
          color: newColor,
        });

      const result = await service.updateTaskLabel(
        'label-1',
        { colorHexCode: '#3b82f6' },
        ownerId,
      );

      expect(colorService.getColorByHexCode).toHaveBeenCalledWith(
        ownerId,
        '#3B82F6',
      );
      expect(labelRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'label-1',
          colorHexCode: '#3B82F6',
          color: newColor,
        }),
      );
      expect(result?.colorHexCode).toBe('#3B82F6');
    });
  });

  describe('getTaskLabelsByOwnerId', () => {
    it('should find labels with color relation included', async () => {
      const labels = [
        {
          id: 'label-1',
          name: 'Work',
          colorHexCode: '#E0E0E0',
          color: { hexCode: '#E0E0E0', name: 'Grey' },
        },
      ];
      labelRepository.find.mockResolvedValue(labels);

      const result = await service.getTaskLabelsByOwnerId(ownerId);

      expect(labelRepository.find).toHaveBeenCalledWith({
        where: { ownerId },
        relations: { color: true },
        order: { createdAt: 'DESC' },
      });
      expect(result).toEqual(labels);
    });
  });
});
