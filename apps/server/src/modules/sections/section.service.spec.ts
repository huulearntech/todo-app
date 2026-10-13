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
    it('should call create_section with parameters and return entity', async () => {
      mockSectionRepo.query.mockResolvedValue([
        {
          id: 'sec-1',
          project_id: 'proj-1',
          owner_id: 'user-1',
          name: 'Section 1',
          description: '',
          color_key: 'red',
          lexorank: '0|hzzzzz:',
          created_at: new Date(),
          updated_at: new Date(),
        },
      ]);

      const result = await service.createSection('user-1', {
        projectId: 'proj-1',
        name: 'Section 1',
        colorKey: 'red',
      });

      expect(mockSectionRepo.query).toHaveBeenCalledWith(
        expect.stringContaining('create_section('),
        expect.arrayContaining([
          'user-1',
          expect.any(String),
          'proj-1',
          'Section 1',
          '',
          'red',
        ]),
      );
      expect(result.id).toBe('sec-1');
      expect(result.colorKey).toBe('red');
    });

    it('should throw NotFoundException if project not found (P0002)', async () => {
      const error: any = new Error('Project not found');
      error.code = 'P0002';
      mockSectionRepo.query.mockRejectedValue(error);

      await expect(
        service.createSection('user-1', {
          projectId: 'proj-1',
          name: 'Section 1',
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateSectionOrder', () => {
    it('should call move_section with parameters', async () => {
      mockSectionRepo.query.mockResolvedValue([]);

      await service.updateSectionOrder({
        ownerId: 'user-1',
        id: 'sec-2',
        prevId: 'sec-1',
      });

      expect(mockSectionRepo.query).toHaveBeenCalledWith(
        expect.stringContaining('move_section('),
        ['user-1', 'sec-2', 'sec-1'],
      );
    });

    it('should throw BadRequestException if bounds invalid (22000)', async () => {
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
