import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { TaskLabelService } from './task-label.service';
import { TaskLabel } from './task-label.entity';

describe('TaskLabelService', () => {
  let service: TaskLabelService;
  let labelRepository: {
    find: jest.Mock;
    findOne: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
    delete: jest.Mock;
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

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TaskLabelService,
        {
          provide: getRepositoryToken(TaskLabel),
          useValue: labelRepository,
        },
      ],
    }).compile();

    service = module.get<TaskLabelService>(TaskLabelService);
  });

  describe('createTaskLabel', () => {
    it('should create label with default color slate', async () => {
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

      expect(labelRepository.create).toHaveBeenCalledWith({
        ownerId,
        name: 'Work',
        description: 'Work tasks',
        colorKey: 'slate',
      });
      expect(result).toEqual(createdLabel);
    });

    it('should create label with custom color', async () => {
      const createdLabel = {
        id: 'label-2',
        ownerId,
        name: 'Urgent',
        colorKey: 'sky',
      };
      labelRepository.findOne.mockResolvedValue(createdLabel);

      const result = await service.createTaskLabel(ownerId, {
        name: 'Urgent',
        colorKey: 'sky',
      });

      expect(labelRepository.create).toHaveBeenCalledWith({
        ownerId,
        name: 'Urgent',
        description: undefined,
        colorKey: 'sky',
      });
      expect(result).toEqual(createdLabel);
    });
  });

  describe('updateTaskLabel', () => {
    it('should update label colorKey directly', async () => {
      const existingLabel = {
        id: 'label-1',
        ownerId,
        name: 'Work',
        colorKey: 'slate',
      };
      labelRepository.findOne
        .mockResolvedValueOnce(existingLabel)
        .mockResolvedValueOnce({
          ...existingLabel,
          colorKey: 'sky',
        });

      const result = await service.updateTaskLabel(
        'label-1',
        { colorKey: 'sky' },
        ownerId,
      );

      expect(labelRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'label-1',
          colorKey: 'sky',
        }),
      );
      expect(result?.colorKey).toBe('sky');
    });
  });

  describe('getTaskLabelsByOwnerId', () => {
    it('should find labels for ownerId ordered by createdAt', async () => {
      const labels = [
        {
          id: 'label-1',
          name: 'Work',
          colorKey: 'slate',
        },
      ];
      labelRepository.find.mockResolvedValue(labels);

      const result = await service.getTaskLabelsByOwnerId(ownerId);

      expect(labelRepository.find).toHaveBeenCalledWith({
        where: { ownerId },
        order: { createdAt: 'DESC' },
      });
      expect(result).toEqual(labels);
    });
  });
});
