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
    getColorByHexCode: jest.Mock;
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
        .mockResolvedValue([{ ownerId, hexCode: '#E0E0E0', name: 'Grey' }]),
      getColorByHexCode: jest.fn().mockResolvedValue({
        ownerId,
        hexCode: '#3B82F6',
        name: 'Blue',
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
    it('should create project with default color #E0E0E0 when omitted', async () => {
      const createdProject = {
        id: 'project-1',
        ownerId,
        name: 'Personal',
        description: 'Personal tasks',
        colorHexCode: '#E0E0E0',
        color: { ownerId, hexCode: '#E0E0E0', name: 'Grey' },
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
        colorHexCode: '#E0E0E0',
        color: { ownerId, hexCode: '#E0E0E0', name: 'Grey' },
      });
      expect(result).toEqual(createdProject);
    });

    it('should create project with custom color after resolving via colorService', async () => {
      const customColor = { ownerId, hexCode: '#3B82F6', name: 'Blue' };
      const createdProject = {
        id: 'project-2',
        ownerId,
        name: 'Work',
        colorHexCode: '#3B82F6',
        color: customColor,
      };
      projectRepository.findOne.mockResolvedValue(createdProject);

      const result = await service.createProject(ownerId, {
        name: 'Work',
        colorHexCode: '#3b82f6',
      });

      expect(colorService.getColorByHexCode).toHaveBeenCalledWith(
        ownerId,
        '#3B82F6',
      );
      expect(projectRepository.create).toHaveBeenCalledWith({
        ownerId,
        name: 'Work',
        description: undefined,
        colorHexCode: '#3B82F6',
        color: customColor,
      });
      expect(result).toEqual(createdProject);
    });
  });

  describe('updateProject', () => {
    it('should update project colorHexCode and color relation', async () => {
      const oldColor = { ownerId, hexCode: '#E0E0E0', name: 'Grey' };
      const newColor = { ownerId, hexCode: '#3B82F6', name: 'Blue' };
      const existingProject = {
        id: 'project-1',
        ownerId,
        name: 'Work',
        colorHexCode: '#E0E0E0',
        color: oldColor,
      };

      projectRepository.findOne
        .mockResolvedValueOnce(existingProject)
        .mockResolvedValueOnce({
          ...existingProject,
          colorHexCode: '#3B82F6',
          color: newColor,
        });

      const result = await service.updateProject(
        'project-1',
        { colorHexCode: '#3b82f6' },
        ownerId,
      );

      expect(colorService.getColorByHexCode).toHaveBeenCalledWith(
        ownerId,
        '#3B82F6',
      );
      expect(projectRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'project-1',
          colorHexCode: '#3B82F6',
          color: newColor,
        }),
      );
      expect(result?.colorHexCode).toBe('#3B82F6');
    });
  });
});
