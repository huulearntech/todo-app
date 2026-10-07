import * as crypto from 'crypto';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UnauthorizedException } from '@nestjs/common';
import { Repository } from 'typeorm';

import { AuthService } from './auth.service';
import { User } from '@/src/modules/users/user.entity';
import { MagicLinkToken } from '../entities/magic-link-token.entity';
import { RefreshTokenService } from './refresh-token.service';
import { UserService } from '@/src/modules/users/user.service';
import { MailerSchedulerService } from '@/src/modules/mailer/services/mailer-scheduler.service';
import { TypedConfigService } from '@/src/config/typed-config.service';

describe('AuthService - Magic Link & Sign Up', () => {
  let service: AuthService;
  let userRepositoryMock: Partial<jest.Mocked<Repository<User>>>;
  let magicLinkTokenRepositoryMock: Partial<
    jest.Mocked<Repository<MagicLinkToken>>
  >;
  let userServiceMock: Partial<jest.Mocked<UserService>>;
  let refreshTokenServiceMock: Partial<jest.Mocked<RefreshTokenService>>;
  let mailerSchedulerServiceMock: Partial<jest.Mocked<MailerSchedulerService>>;
  let configServiceMock: Partial<jest.Mocked<TypedConfigService>>;

  const mockUser: User = {
    id: '11111111-1111-1111-1111-111111111111',
    email: 'test@example.com',
    name: 'Test User',
    passwordHashed: 'hashed_pw',
    createdAt: new Date(),
    updatedAt: new Date(),
    defaultProjectId: '22222222-2222-2222-2222-222222222222',
    isEmailVerified: false,
    taskLabels: [],
    projects: [],
    colors: [],
    refreshTokens: [],
    magicLinkTokens: [],
    goals: [],
  };

  beforeEach(async () => {
    userRepositoryMock = {
      findOne: jest.fn(),
      save: jest.fn().mockImplementation((u) => Promise.resolve(u)),
    };

    magicLinkTokenRepositoryMock = {
      findOne: jest.fn(),
      create: jest.fn().mockImplementation((dto) => dto as MagicLinkToken),
      save: jest.fn().mockImplementation((entity) => Promise.resolve(entity)),
      update: jest
        .fn()
        .mockResolvedValue({ affected: 1, raw: [], generatedMaps: [] }),
    };

    userServiceMock = {
      createUser: jest.fn().mockResolvedValue({
        id: mockUser.id,
        email: mockUser.email,
        name: mockUser.name,
        avatarUrl: mockUser.avatarUrl,
        defaultProjectId: mockUser.defaultProjectId,
        isEmailVerified: false,
      }),
    };

    refreshTokenServiceMock = {
      generatePairOfTokens: jest.fn(),
      createRefreshToken: jest.fn(),
      revokeAllUserTokens: jest.fn(),
    };

    mailerSchedulerServiceMock = {
      sendImmediateEmail: jest.fn().mockResolvedValue(undefined),
    };

    configServiceMock = {
      get: jest.fn().mockImplementation((key: string) => {
        if (key === 'BACKEND_URL') return 'http://localhost:4000';
        if (key === 'FRONTEND_URL') return 'http://localhost:3000';
        return undefined;
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(User),
          useValue: userRepositoryMock,
        },
        {
          provide: getRepositoryToken(MagicLinkToken),
          useValue: magicLinkTokenRepositoryMock,
        },
        {
          provide: UserService,
          useValue: userServiceMock,
        },
        {
          provide: RefreshTokenService,
          useValue: refreshTokenServiceMock,
        },
        {
          provide: MailerSchedulerService,
          useValue: mailerSchedulerServiceMock,
        },
        {
          provide: TypedConfigService,
          useValue: configServiceMock,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  describe('signUp', () => {
    it('should create user via UserService and dispatch verification email instead of welcome email', async () => {
      userRepositoryMock.findOne!.mockResolvedValue(mockUser);

      const result = await service.signUp({
        email: 'test@example.com',
        name: 'Test User',
        password: 'password123',
      });

      expect(userServiceMock.createUser).toHaveBeenCalledWith({
        email: 'test@example.com',
        name: 'Test User',
        password: 'password123',
      });

      expect(result.id).toBe(mockUser.id);
      expect(result.email).toBe(mockUser.email);

      // Verify that magic-link verification email was sent, NOT welcome email
      expect(
        mailerSchedulerServiceMock.sendImmediateEmail,
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          to: mockUser.email,
          templateType: 'magic-link',
          context: expect.objectContaining({
            name: mockUser.name,
            actionUrl: expect.stringContaining(
              '/auth/magic-link/callback?token=',
            ),
          }),
        }),
      );
      expect(
        mailerSchedulerServiceMock.sendImmediateEmail,
      ).not.toHaveBeenCalledWith(
        expect.objectContaining({
          templateType: 'welcome',
        }),
      );
    });
  });

  describe('sendMagicLink', () => {
    it('should generate a token, save hashed token, and enqueue email when user exists', async () => {
      userRepositoryMock.findOne!.mockResolvedValue(mockUser);

      const result = await service.sendMagicLink('test@example.com');

      expect(result.success).toBe(true);
      expect(userRepositoryMock.findOne).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
      });

      // Verify previous tokens were invalidated
      expect(magicLinkTokenRepositoryMock.update).toHaveBeenCalledWith(
        { userId: mockUser.id, isUsed: false },
        { isUsed: true },
      );

      // Verify token creation and save
      expect(magicLinkTokenRepositoryMock.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: mockUser.id,
          isUsed: false,
        }),
      );
      expect(magicLinkTokenRepositoryMock.save).toHaveBeenCalled();

      // Verify verification email queued
      expect(
        mailerSchedulerServiceMock.sendImmediateEmail,
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          to: mockUser.email,
          templateType: 'magic-link',
          context: {
            name: mockUser.name,
            actionUrl: expect.stringContaining(
              '/auth/magic-link/callback?token=',
            ),
          },
        }),
      );
    });

    it('should return safe generic message and not send email if user does not exist', async () => {
      userRepositoryMock.findOne!.mockResolvedValue(null);

      const result = await service.sendMagicLink('nonexistent@example.com');

      expect(result.success).toBe(true);
      expect(magicLinkTokenRepositoryMock.create).not.toHaveBeenCalled();
      expect(magicLinkTokenRepositoryMock.save).not.toHaveBeenCalled();
      expect(
        mailerSchedulerServiceMock.sendImmediateEmail,
      ).not.toHaveBeenCalled();
    });
  });

  describe('validateMagicLinkToken', () => {
    const rawToken =
      '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
    const tokenHash = crypto
      .createHash('sha256')
      .update(rawToken)
      .digest('hex');

    it('should validate valid token, mark used, verify email, send welcome email, and return user', async () => {
      const mockTokenEntity: MagicLinkToken = {
        tokenHash,
        userId: mockUser.id,
        user: { ...mockUser, isEmailVerified: false },
        expiresAt: new Date(Date.now() + 10 * 60 * 1000), // future
        isUsed: false,
        createdAt: new Date(),
      };

      magicLinkTokenRepositoryMock.findOne!.mockResolvedValue(mockTokenEntity);

      const validatedUser = await service.validateMagicLinkToken(rawToken);

      expect(validatedUser.id).toBe(mockUser.id);
      expect(mockTokenEntity.isUsed).toBe(true);
      expect(magicLinkTokenRepositoryMock.save).toHaveBeenCalledWith(
        mockTokenEntity,
      );
      expect(validatedUser.isEmailVerified).toBe(true);
      expect(userRepositoryMock.save).toHaveBeenCalledWith(
        expect.objectContaining({ isEmailVerified: true }),
      );

      // Verify that welcome email is now sent after verification
      expect(
        mailerSchedulerServiceMock.sendImmediateEmail,
      ).toHaveBeenCalledWith({
        to: mockUser.email,
        subject: 'Welcome to Todo App!',
        templateType: 'welcome',
        context: {
          name: mockUser.name,
        },
      });
    });

    it('should not send duplicate welcome email if user was already verified', async () => {
      const mockTokenEntity: MagicLinkToken = {
        tokenHash,
        userId: mockUser.id,
        user: { ...mockUser, isEmailVerified: true },
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
        isUsed: false,
        createdAt: new Date(),
      };

      magicLinkTokenRepositoryMock.findOne!.mockResolvedValue(mockTokenEntity);

      const validatedUser = await service.validateMagicLinkToken(rawToken);

      expect(validatedUser.id).toBe(mockUser.id);
      expect(
        mailerSchedulerServiceMock.sendImmediateEmail,
      ).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException if token not found in DB', async () => {
      magicLinkTokenRepositoryMock.findOne!.mockResolvedValue(null);

      await expect(
        service.validateMagicLinkToken('invalid_token'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if token has already been used', async () => {
      const mockTokenEntity: MagicLinkToken = {
        tokenHash,
        userId: mockUser.id,
        user: mockUser,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
        isUsed: true,
        createdAt: new Date(),
      };

      magicLinkTokenRepositoryMock.findOne!.mockResolvedValue(mockTokenEntity);

      await expect(service.validateMagicLinkToken(rawToken)).rejects.toThrow(
        'Magic link token has already been used',
      );
    });

    it('should throw UnauthorizedException if token has expired', async () => {
      const mockTokenEntity: MagicLinkToken = {
        tokenHash,
        userId: mockUser.id,
        user: mockUser,
        expiresAt: new Date(Date.now() - 1000), // past
        isUsed: false,
        createdAt: new Date(),
      };

      magicLinkTokenRepositoryMock.findOne!.mockResolvedValue(mockTokenEntity);

      await expect(service.validateMagicLinkToken(rawToken)).rejects.toThrow(
        'Magic link token has expired',
      );
    });
  });
});
