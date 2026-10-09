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
    getColorByKey: jest.Mock;
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
      ensureDefaultColors: jest.fn().mockResolvedValue([
        { ownerId, key: 'slate', name: 'Slate' },
      ]),
      getColorByKey: jest.fn().mockResolvedValue({
        ownerId,
        key: 'sky',
        name: 'Sky Blue',
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
    it('should create label with default color slate and call ensureDefaultColors', async () => {
      const createdLabel = {
        id: 'label-1',
        ownerId,
        name: 'Work',
        description: 'Work tasks',
        colorKey: 'slate',
      };
      labelRepository.findOne.mockResolvedValue(createdLabel);

      const result = await service.createTaskLabel(ownerId, {
        name: 'Work',
        description: 'Work tasks',
        colorKey: 'slate',
      });

      expect(colorService.ensureDefaultColors).toHaveBeenCalledWith(ownerId);
      expect(labelRepository.create).toHaveBeenCalledWith({
        ownerId,
        name: 'Work',
        description: 'Work tasks',
        colorKey: 'slate',
        color: { ownerId, key: 'slate', name: 'Slate' },
      });
      expect(result).toEqual(createdLabel);
    });

    it('should create label with custom color after validating via colorService', async () => {
      const targetColor = {
        ownerId,
        key: 'sky',
        name: 'Sky Blue',
      };
      const createdLabel = {
        id: 'label-2',
        ownerId,
        name: 'Urgent',
        colorKey: 'sky',
        color: targetColor,
      };
      labelRepository.findOne.mockResolvedValue(createdLabel);

      const result = await service.createTaskLabel(ownerId, {
        name: 'Urgent',
        colorKey: 'sky',
      });

      expect(colorService.getColorByKey).toHaveBeenCalledWith(
        ownerId,
        'sky',
      );
      expect(labelRepository.create).toHaveBeenCalledWith({
        ownerId,
        name: 'Urgent',
        description: undefined,
        colorKey: 'sky',
        color: targetColor,
      });
      expect(result).toEqual(createdLabel);
    });
  });

  describe('updateTaskLabel', () => {
    it('should update label colorKey and color relation entity', async () => {
      const oldColor = {
        ownerId,
        key: 'slate',
        name: 'Slate',
      };
      const newColor = {
        ownerId,
        key: 'sky',
        name: 'Sky Blue',
      };
      const existingLabel = {
        id: 'label-1',
        ownerId,
        name: 'Work',
        colorKey: 'slate',
        color: oldColor,
      };
      labelRepository.findOne
        .mockResolvedValueOnce(existingLabel)
        .mockResolvedValueOnce({
          ...existingLabel,
          colorKey: 'sky',
          color: newColor,
        });

      const result = await service.updateTaskLabel(
        'label-1',
        { colorKey: 'sky' },
        ownerId,
      );

      expect(colorService.getColorByKey).toHaveBeenCalledWith(
        ownerId,
        'sky',
      );
      expect(labelRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'label-1',
          colorKey: 'sky',
          color: newColor,
        }),
      );
      expect(result?.colorKey).toBe('sky');
    });
  });

  describe('getTaskLabelsByOwnerId', () => {
    it('should find labels with color relation included', async () => {
      const labels = [
        {
          id: 'label-1',
          name: 'Work',
          colorKey: 'slate',
          color: { key: 'slate', name: 'Slate' },
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
