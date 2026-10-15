import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { SectionService } from './section.service';
import { Section } from './section.entity';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('SectionService', () => {
  let service: SectionService;
  let mockSectionRepo: any;

  beforeEach(async () => {
    mockSectionRepo = {
      query: jest.fn(),
      create: jest.fn((val) => val),
      findOne: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
      createQueryBuilder: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SectionService,
        {
          provide: getRepositoryToken(Section),
          useValue: mockSectionRepo,
        },
      ],
    }).compile();

    service = module.get<SectionService>(SectionService);
  });

  describe('createSection', () => {
    it('should create and save section entity with parameters', async () => {
      mockSectionRepo.save.mockImplementation(async (entity: any) => ({
        ...entity,
        id: 'sec-1',
        lexorank: '0|hzzzzz:',
      }));

      const result = await service.createSection('user-1', {
        projectId: 'proj-1',
        name: 'Section 1',
        colorKey: 'red',
      });

      expect(mockSectionRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          ownerId: 'user-1',
          projectId: 'proj-1',
          name: 'Section 1',
          colorKey: 'red',
        }),
      );
      expect(mockSectionRepo.save).toHaveBeenCalled();
      expect(result.id).toBe('sec-1');
      expect(result.colorKey).toBe('red');
    });

    it('should throw NotFoundException if ordering error code is P0002', async () => {
      const error: any = new Error('Project not found');
      error.code = 'P0002';
      mockSectionRepo.save.mockRejectedValue(error);

      await expect(
        service.createSection('user-1', {
          projectId: 'proj-1',
          name: 'Section 1',
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateSectionOrder', () => {
    it('should call move_section_lexorank with parameters after checking ownership', async () => {
      mockSectionRepo.findOne.mockResolvedValue({ id: 'sec-2' });
      mockSectionRepo.query.mockResolvedValue([]);

      await service.updateSectionOrder({
        ownerId: 'user-1',
        id: 'sec-2',
        prevId: 'sec-1',
      });

      expect(mockSectionRepo.findOne).toHaveBeenCalledWith({
        where: { id: 'sec-2', project: { ownerId: 'user-1' } },
      });
      expect(mockSectionRepo.query).toHaveBeenCalledWith(
        expect.stringContaining('move_section_lexorank('),
        ['sec-2', 'sec-1'],
      );
    });

    it('should throw NotFoundException if section not owned by user', async () => {
      mockSectionRepo.findOne.mockResolvedValue(null);

      await expect(
        service.updateSectionOrder({
          ownerId: 'user-1',
          id: 'sec-2',
          prevId: 'sec-1',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if bounds invalid (22000)', async () => {
      mockSectionRepo.findOne.mockResolvedValue({ id: 'sec-2' });
      const error: any = new Error(
        'A section cannot be positioned after itself',
      );
      error.code = '22000';
      mockSectionRepo.query.mockRejectedValue(error);

      await expect(
        service.updateSectionOrder({
          ownerId: 'user-1',
          id: 'sec-2',
          prevId: 'sec-2',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
