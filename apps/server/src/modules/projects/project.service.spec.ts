import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { ProjectService } from './project.service';
import { Project } from './project.entity';
import { User } from '../users/user.entity';

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
  let userRepository: {
    findOne: jest.Mock;
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

    userRepository = {
      findOne: jest.fn().mockResolvedValue({
        id: ownerId,
        defaultProjectId: 'default-inbox-id',
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
          provide: getRepositoryToken(User),
          useValue: userRepository,
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
      };
      projectRepository.findOne.mockResolvedValue(createdProject);

      const result = await service.createProject(ownerId, {
        name: 'Personal',
        description: 'Personal tasks',
      });

      expect(projectRepository.create).toHaveBeenCalledWith({
        ownerId,
        name: 'Personal',
        description: 'Personal tasks',
        colorKey: 'slate',
      });
      expect(result).toEqual(createdProject);
    });

    it('should create project with custom color', async () => {
      const createdProject = {
        id: 'project-2',
        ownerId,
        name: 'Work',
        colorKey: 'sky',
      };
      projectRepository.findOne.mockResolvedValue(createdProject);

      const result = await service.createProject(ownerId, {
        name: 'Work',
        colorKey: 'sky',
      });

      expect(projectRepository.create).toHaveBeenCalledWith({
        ownerId,
        name: 'Work',
        description: undefined,
        colorKey: 'sky',
      });
      expect(result).toEqual(createdProject);
    });
  });

  describe('updateProject', () => {
    it('should update project colorKey directly', async () => {
      const existingProject = {
        id: 'project-1',
        ownerId,
        name: 'Work',
        colorKey: 'slate',
      };

      projectRepository.findOne
        .mockResolvedValueOnce(existingProject)
        .mockResolvedValueOnce({
          ...existingProject,
          colorKey: 'sky',
        });

      const result = await service.updateProject(
        'project-1',
        { colorKey: 'sky' },
        ownerId,
      );

      expect(projectRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'project-1',
          colorKey: 'sky',
        }),
      );
      expect(result?.colorKey).toBe('sky');
    });
  });

  describe('deleteProject', () => {
    it('should throw ConflictException when trying to delete the default inbox project', async () => {
      await expect(
        service.deleteProject('default-inbox-id', ownerId),
      ).rejects.toThrow(ConflictException);
    });

    it('should delete project successfully when not default inbox', async () => {
      projectRepository.findOne.mockResolvedValue({
        id: 'other-project-id',
        ownerId,
      });
      projectRepository.delete.mockResolvedValue({ affected: 1 });

      await service.deleteProject('other-project-id', ownerId);

      expect(projectRepository.delete).toHaveBeenCalledWith({
        id: 'other-project-id',
      });
    });
  });
});
