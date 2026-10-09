import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ProjectService } from './project.service';
import { Project } from './project.entity';
import { ColorService } from '../colors/color.service';

describe('ProjectService', () => {
  let service: ProjectService;
  let projectRepository: {
    find: jest.Mock;
    findOne: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
    delete: jest.Mock;
    manager: {
      transaction: jest.Mock;
    };
  };
  let colorService: {
    ensureDefaultColors: jest.Mock;
    getColorByKey: jest.Mock;
  };

  const ownerId = '11111111-1111-1111-1111-111111111111';

  beforeEach(async () => {
    projectRepository = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn((entity: Partial<Project>) => entity as Project),
      save: jest.fn((entity: Partial<Project>) =>
        Promise.resolve({ id: 'project-1', ...entity } as Project),
      ),
      delete: jest.fn(),
      manager: {
        transaction: jest.fn(),
      },
    };

    colorService = {
      ensureDefaultColors: jest
        .fn()
        .mockResolvedValue([{ ownerId, key: 'slate', name: 'Slate' }]),
      getColorByKey: jest.fn().mockResolvedValue({
        ownerId,
        key: 'sky',
        name: 'Sky Blue',
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProjectService,
        {
          provide: getRepositoryToken(Project),
          useValue: projectRepository,
        },
        {
          provide: ColorService,
          useValue: colorService,
        },
      ],
    }).compile();

    service = module.get<ProjectService>(ProjectService);
  });

  describe('createProject', () => {
    it('should create project with default color slate when omitted', async () => {
      const createdProject = {
        id: 'project-1',
        ownerId,
        name: 'Personal',
        description: 'Personal tasks',
        colorKey: 'slate',
        color: { ownerId, key: 'slate', name: 'Slate' },
      };
      projectRepository.findOne.mockResolvedValue(createdProject);

      const result = await service.createProject(ownerId, {
        name: 'Personal',
        description: 'Personal tasks',
      });

      expect(colorService.ensureDefaultColors).toHaveBeenCalledWith(ownerId);
      expect(projectRepository.create).toHaveBeenCalledWith({
        ownerId,
        name: 'Personal',
        description: 'Personal tasks',
        colorKey: 'slate',
        color: { ownerId, key: 'slate', name: 'Slate' },
      });
      expect(result).toEqual(createdProject);
    });

    it('should create project with custom color after resolving via colorService', async () => {
      const customColor = { ownerId, key: 'sky', name: 'Sky Blue' };
      const createdProject = {
        id: 'project-2',
        ownerId,
        name: 'Work',
        colorKey: 'sky',
        color: customColor,
      };
      projectRepository.findOne.mockResolvedValue(createdProject);

      const result = await service.createProject(ownerId, {
        name: 'Work',
        colorKey: 'sky',
      });

      expect(colorService.getColorByKey).toHaveBeenCalledWith(
        ownerId,
        'sky',
      );
      expect(projectRepository.create).toHaveBeenCalledWith({
        ownerId,
        name: 'Work',
        description: undefined,
        colorKey: 'sky',
        color: customColor,
      });
      expect(result).toEqual(createdProject);
    });
  });

  describe('updateProject', () => {
    it('should update project colorKey and color relation', async () => {
      const oldColor = { ownerId, key: 'slate', name: 'Slate' };
      const newColor = { ownerId, key: 'sky', name: 'Sky Blue' };
      const existingProject = {
        id: 'project-1',
        ownerId,
        name: 'Work',
        colorKey: 'slate',
        color: oldColor,
      };

      projectRepository.findOne
        .mockResolvedValueOnce(existingProject)
        .mockResolvedValueOnce({
          ...existingProject,
          colorKey: 'sky',
          color: newColor,
        });

      const result = await service.updateProject(
        'project-1',
        { colorKey: 'sky' },
        ownerId,
      );

      expect(colorService.getColorByKey).toHaveBeenCalledWith(
        ownerId,
        'sky',
      );
      expect(projectRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'project-1',
          colorKey: 'sky',
          color: newColor,
        }),
      );
      expect(result?.colorKey).toBe('sky');
    });
  });
});
