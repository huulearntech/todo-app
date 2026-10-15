import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { ConflictException } from '@nestjs/common';
import argon2 from 'argon2';
import { AUTH_ERROR_CODES } from '@todo/shared';

import { UserService } from './user.service';
import { User } from './user.entity';
import { Project } from '../projects/project.entity';
import { UserGoal } from './entities/user-goal.entity';

describe('UserService', () => {
  let service: UserService;
  let userRepository: jest.Mocked<Repository<User>>;
  let dataSource: jest.Mocked<DataSource>;

  const mockUser: User = {
    id: 'user-uuid-1',
    email: 'test@example.com',
    name: 'Test User',
    passwordHashed: 'old_hashed_password',
    createdAt: new Date(),
    updatedAt: new Date(),
    defaultProjectId: 'project-uuid-1',
    isEmailVerified: false,
    taskLabels: [],
    projects: [],
    refreshTokens: [],
    magicLinkTokens: [],
    goals: [],
  };

  beforeEach(async () => {
    userRepository = {
      findOne: jest.fn(),
      save: jest.fn(),
      create: jest.fn().mockImplementation((dto) => dto as User),
      delete: jest.fn(),
    } as unknown as jest.Mocked<Repository<User>>;

    const mockEntityManager = {
      save: jest.fn().mockImplementation((entityClass, entity) => {
        if (entityClass === User) {
          return Promise.resolve({
            ...entity,
            id: 'new-user-id',
            isEmailVerified: false,
          });
        }
        return Promise.resolve(entity);
      }),
    };

    dataSource = {
      transaction: jest
        .fn()
        .mockImplementation((cb) => cb(mockEntityManager)),
    } as unknown as jest.Mocked<DataSource>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: getRepositoryToken(User),
          useValue: userRepository,
        },
        {
          provide: DataSource,
          useValue: dataSource,
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
  });

  describe('createUser', () => {
    it('should create a new user, inbox project, and goal if email does not exist', async () => {
      userRepository.findOne.mockResolvedValue(null);

      const result = await service.createUser({
        email: 'NEW@EXAMPLE.COM',
        name: 'New User',
        password: 'password123',
      });

      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { email: 'new@example.com' },
      });
      expect(dataSource.transaction).toHaveBeenCalled();
      expect(result.id).toBe('new-user-id');
      expect(result.email).toBe('new@example.com');
      expect(result.name).toBe('New User');
      expect(result.isEmailVerified).toBe(false);
    });

    it('should throw ConflictException if email exists and is already verified', async () => {
      userRepository.findOne.mockResolvedValue({
        ...mockUser,
        isEmailVerified: true,
      });

      await expect(
        service.createUser({
          email: 'test@example.com',
          name: 'Another Name',
          password: 'newpassword123',
        }),
      ).rejects.toThrow(ConflictException);

      try {
        await service.createUser({
          email: 'test@example.com',
          name: 'Another Name',
          password: 'newpassword123',
        });
      } catch (err: unknown) {
        expect(err).toBeInstanceOf(ConflictException);
        const response = (err as ConflictException).getResponse() as {
          code: string;
          message: string;
        };
        expect(response.code).toBe(AUTH_ERROR_CODES.EMAIL_ALREADY_EXISTS);
      }
    });

    it('should update password and name if email exists but is NOT verified (re-registration)', async () => {
      userRepository.findOne.mockResolvedValue({
        ...mockUser,
        isEmailVerified: false,
      });

      userRepository.save.mockImplementation((userToSave) =>
        Promise.resolve(userToSave as User),
      );

      const result = await service.createUser({
        email: 'test@example.com',
        name: 'Updated Name',
        password: 'brandnewpassword123',
      });

      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
      });
      expect(dataSource.transaction).not.toHaveBeenCalled(); // no need to recreate Inbox or Goals
      expect(userRepository.save).toHaveBeenCalled();

      // Verify the password was hashed with argon2
      const savedUserArg = userRepository.save.mock.calls[0][0];
      expect(savedUserArg.name).toBe('Updated Name');
      const passwordMatches = await argon2.verify(
        savedUserArg.passwordHashed!,
        'brandnewpassword123',
      );
      expect(passwordMatches).toBe(true);

      expect(result.id).toBe(mockUser.id);
      expect(result.name).toBe('Updated Name');
      expect(result.isEmailVerified).toBe(false);
    });
  });
});
