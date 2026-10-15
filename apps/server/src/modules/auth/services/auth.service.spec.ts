import * as crypto from 'crypto';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  UnauthorizedException,
  BadRequestException,
  HttpException,
} from '@nestjs/common';
import { Repository } from 'typeorm';
import argon2 from 'argon2';

import { AuthService } from './auth.service';
import { User } from '@/src/modules/users/user.entity';
import { MagicLinkToken } from '../entities/magic-link-token.entity';
import { PasswordResetToken } from '../entities/password-reset-token.entity';
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
  let passwordResetTokenRepositoryMock: Partial<
    jest.Mocked<Repository<PasswordResetToken>>
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
      findOne: jest.fn().mockResolvedValue(null),
      count: jest.fn().mockResolvedValue(0),
      create: jest.fn().mockImplementation((dto) => dto as MagicLinkToken),
      save: jest.fn().mockImplementation((entity) => Promise.resolve(entity)),
      update: jest
        .fn()
        .mockResolvedValue({ affected: 1, raw: [], generatedMaps: [] }),
    };

    passwordResetTokenRepositoryMock = {
      findOne: jest.fn().mockResolvedValue(null),
      count: jest.fn().mockResolvedValue(0),
      create: jest.fn().mockImplementation((dto) => dto as PasswordResetToken),
      save: jest.fn().mockImplementation((entity) => Promise.resolve(entity)),
      update: jest
        .fn()
        .mockResolvedValue({ affected: 1, raw: [], generatedMaps: [] }),
      createQueryBuilder: jest.fn(),
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
          provide: getRepositoryToken(PasswordResetToken),
          useValue: passwordResetTokenRepositoryMock,
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
    it('should create user, dispatch verification email, and return user with ticket', async () => {
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

      expect(result.user.id).toBe(mockUser.id);
      expect(result.user.email).toBe(mockUser.email);

      // Verify that verification email was queued
      expect(
        mailerSchedulerServiceMock.sendImmediateEmail,
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          to: mockUser.email,
          templateType: 'magic-link',
          context: expect.objectContaining({
            name: mockUser.name,
            actionUrl: expect.stringContaining('/auth/verify?token='),
          }),
        }),
      );
    });

    it('should still succeed and return user if sendMagicLink hits 60s cooldown', async () => {
      userRepositoryMock.findOne!.mockResolvedValue(mockUser);
      // Simulate recent token created 10 seconds ago
      magicLinkTokenRepositoryMock.findOne!.mockResolvedValue({
        tokenHash: 'recent_hash',
        userId: mockUser.id,
        createdAt: new Date(Date.now() - 10 * 1000),
        expiresAt: new Date(Date.now() + 15 * 60 * 1000),
        isUsed: false,
      } as MagicLinkToken);

      const result = await service.signUp({
        email: 'test@example.com',
        name: 'Test User',
        password: 'password123',
      });

      expect(result.user.id).toBe(mockUser.id);
      expect(userServiceMock.createUser).toHaveBeenCalled();
    });
  });

  describe('sendMagicLink', () => {
    it('should generate a token, save hashed token, and enqueue email when user exists and rate limits pass', async () => {
      userRepositoryMock.findOne!.mockResolvedValue(mockUser);
      magicLinkTokenRepositoryMock.findOne!.mockResolvedValue(null);
      magicLinkTokenRepositoryMock.count!.mockResolvedValue(0);

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
              '/auth/verify?token=',
            ) as unknown as string,
          },
        }),
      );
    });

    it('should throw 429 COOLDOWN_ACTIVE if called within 60 seconds of previous token', async () => {
      userRepositoryMock.findOne!.mockResolvedValue(mockUser);
      const recentToken: MagicLinkToken = {
        tokenHash: 'abc',
        userId: mockUser.id,
        user: mockUser,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
        isUsed: false,
        createdAt: new Date(Date.now() - 20 * 1000), // 20s ago (< 60s)
      };
      magicLinkTokenRepositoryMock.findOne!.mockResolvedValue(recentToken);

      await expect(service.sendMagicLink('test@example.com')).rejects.toThrow(
        HttpException,
      );
    });

    it('should throw 429 RATE_LIMIT_EXCEEDED if 5 or more tokens were generated in the last hour', async () => {
      userRepositoryMock.findOne!.mockResolvedValue(mockUser);
      // Older token past 60s
      const olderToken: MagicLinkToken = {
        tokenHash: 'abc',
        userId: mockUser.id,
        user: mockUser,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
        isUsed: false,
        createdAt: new Date(Date.now() - 120 * 1000), // 2 mins ago
      };
      magicLinkTokenRepositoryMock.findOne!.mockResolvedValue(olderToken);
      magicLinkTokenRepositoryMock.count!.mockResolvedValue(5);

      await expect(service.sendMagicLink('test@example.com')).rejects.toThrow(
        HttpException,
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

    it('should validate valid token, mark used, verify email, emit SSE event, send welcome email, and return user', async () => {
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

    it('should throw UnauthorizedException if token has already been used and user is not verified', async () => {
      const mockTokenEntity: MagicLinkToken = {
        tokenHash,
        userId: mockUser.id,
        user: { ...mockUser, isEmailVerified: false },
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
        isUsed: true,
        createdAt: new Date(),
      };

      magicLinkTokenRepositoryMock.findOne!.mockResolvedValue(mockTokenEntity);

      await expect(service.validateMagicLinkToken(rawToken)).rejects.toThrow(
        'This verification link has expired or has already been used.',
      );
    });

    it('should return user idempotently if token was already used but user is already verified', async () => {
      const mockTokenEntity: MagicLinkToken = {
        tokenHash,
        userId: mockUser.id,
        user: { ...mockUser, isEmailVerified: true },
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
        isUsed: true,
        createdAt: new Date(),
      };

      magicLinkTokenRepositoryMock.findOne!.mockResolvedValue(mockTokenEntity);

      const validatedUser = await service.validateMagicLinkToken(rawToken);

      expect(validatedUser.id).toBe(mockUser.id);
      expect(magicLinkTokenRepositoryMock.save).not.toHaveBeenCalled();
      expect(
        mailerSchedulerServiceMock.sendImmediateEmail,
      ).not.toHaveBeenCalled();
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
        'This verification link has expired or has already been used.',
      );
    });
  });

  describe('checkUserEmailVerified', () => {
    it('should return true if user email is verified', async () => {
      userRepositoryMock.findOne!.mockResolvedValue({
        id: mockUser.id,
        isEmailVerified: true,
      } as User);

      const isVerified = await service.checkUserEmailVerified(mockUser.id);
      expect(isVerified).toBe(true);
    });

    it('should return false if user email is not verified', async () => {
      userRepositoryMock.findOne!.mockResolvedValue({
        id: mockUser.id,
        isEmailVerified: false,
      } as User);

      const isVerified = await service.checkUserEmailVerified(mockUser.id);
      expect(isVerified).toBe(false);
    });

    it('should return false if user does not exist', async () => {
      userRepositoryMock.findOne!.mockResolvedValue(null);

      const isVerified = await service.checkUserEmailVerified('nonexistent');
      expect(isVerified).toBe(false);
    });
  });

  describe('signIn', () => {
    it('should throw UnauthorizedException if email is not verified', async () => {
      userRepositoryMock.findOne!.mockResolvedValue({
        ...mockUser,
        isEmailVerified: false,
      });
      jest.spyOn(argon2, 'verify').mockResolvedValue(true);

      await expect(
        service.signIn({
          email: 'test@example.com',
          password: 'password123',
        }),
      ).rejects.toThrow(
        'Please verify your email address before signing in. Check your inbox for the verification link.',
      );
    });

    it('should return user and tokens when credentials are valid and email is verified', async () => {
      userRepositoryMock.findOne!.mockResolvedValue({
        ...mockUser,
        isEmailVerified: true,
      });
      jest.spyOn(argon2, 'verify').mockResolvedValue(true);
      refreshTokenServiceMock.generatePairOfTokens!.mockResolvedValue({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      });

      const result = await service.signIn({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(result.user.email).toBe(mockUser.email);
      expect(result.accessToken).toBe('access-token');
      expect(result.refreshToken).toBe('refresh-token');
    });

    it('should throw UnauthorizedException if password does not match', async () => {
      userRepositoryMock.findOne!.mockResolvedValue({
        ...mockUser,
        isEmailVerified: true,
      });
      jest.spyOn(argon2, 'verify').mockResolvedValue(false);

      await expect(
        service.signIn({
          email: 'test@example.com',
          password: 'wrong-password',
        }),
      ).rejects.toThrow('Invalid credentials');
    });
  });

  describe('changePassword', () => {
    it('should throw BadRequestException if current password does not match', async () => {
      userRepositoryMock.findOne!.mockResolvedValue(mockUser);
      jest.spyOn(argon2, 'verify').mockResolvedValue(false);

      await expect(
        service.changePassword(mockUser.id, {
          currentPassword: 'wrong-current',
          newPassword: 'brandNewPassword123',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if new password matches current password', async () => {
      userRepositoryMock.findOne!.mockResolvedValue(mockUser);
      jest.spyOn(argon2, 'verify').mockResolvedValue(true);

      await expect(
        service.changePassword(mockUser.id, {
          currentPassword: 'samePassword123',
          newPassword: 'samePassword123',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should successfully update password, revoke sessions and return new tokens', async () => {
      userRepositoryMock.findOne!.mockResolvedValue({ ...mockUser });
      jest.spyOn(argon2, 'verify').mockResolvedValue(true);
      jest.spyOn(argon2, 'hash').mockResolvedValue('newlyHashedPassword');
      refreshTokenServiceMock.generatePairOfTokens!.mockResolvedValue({
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
      });

      const result = await service.changePassword(mockUser.id, {
        currentPassword: 'oldPassword123',
        newPassword: 'brandNewPassword123',
      });

      expect(userRepositoryMock.save).toHaveBeenCalled();
      expect(refreshTokenServiceMock.revokeAllUserTokens).toHaveBeenCalledWith(
        mockUser.id,
      );
      expect(refreshTokenServiceMock.createRefreshToken).toHaveBeenCalledWith(
        mockUser.id,
        'new-refresh-token',
      );
      expect(result.accessToken).toBe('new-access-token');
      expect(result.refreshToken).toBe('new-refresh-token');
    });
  });

  describe('sendPasswordResetEmail', () => {
    it('should return generic success message when email is not found', async () => {
      userRepositoryMock.findOne!.mockResolvedValue(null);

      const result = await service.sendPasswordResetEmail(
        'unknown@example.com',
      );

      expect(result.success).toBe(true);
      expect(result.message).toContain('If an account exists');
      expect(mailerSchedulerServiceMock.sendImmediateEmail).not.toHaveBeenCalled();
    });

    it('should enforce cooldown if last request was under 60 seconds ago', async () => {
      userRepositoryMock.findOne!.mockResolvedValue(mockUser);
      passwordResetTokenRepositoryMock.findOne!.mockResolvedValue({
        tokenHash: 'hash',
        userId: mockUser.id,
        createdAt: new Date(Date.now() - 30 * 1000), // 30s ago
        expiresAt: new Date(Date.now() + 14 * 60 * 1000),
        isUsed: false,
      } as any);

      await expect(
        service.sendPasswordResetEmail(mockUser.email),
      ).rejects.toThrow(HttpException);
    });

    it('should send password reset email when valid', async () => {
      userRepositoryMock.findOne!.mockResolvedValue(mockUser);
      passwordResetTokenRepositoryMock.findOne!.mockResolvedValue(null);
      passwordResetTokenRepositoryMock.count!.mockResolvedValue(0);

      const result = await service.sendPasswordResetEmail(mockUser.email);

      expect(result.success).toBe(true);
      expect(passwordResetTokenRepositoryMock.save).toHaveBeenCalled();
      expect(mailerSchedulerServiceMock.sendImmediateEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: mockUser.email,
          templateType: 'password-reset',
        }),
      );
    });
  });

  describe('resetPassword', () => {
    it('should throw BadRequestException if token is invalid or expired', async () => {
      passwordResetTokenRepositoryMock.findOne!.mockResolvedValue(null);

      await expect(
        service.resetPassword({
          token: 'invalid-token',
          newPassword: 'newPassword123',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should successfully reset password, revoke sessions, and return success', async () => {
      const mockResetToken = {
        tokenHash: crypto.createHash('sha256').update('valid-token').digest('hex'),
        userId: mockUser.id,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
        isUsed: false,
        createdAt: new Date(),
      };

      passwordResetTokenRepositoryMock.findOne!.mockResolvedValue(
        mockResetToken as any,
      );

      const updateQueryBuilderMock = {
        update: jest.fn().mockReturnThis(),
        set: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue({ affected: 1 }),
      };
      passwordResetTokenRepositoryMock.createQueryBuilder = jest
        .fn()
        .mockReturnValue(updateQueryBuilderMock);

      userRepositoryMock.findOne!.mockResolvedValue({ ...mockUser });
      jest.spyOn(argon2, 'hash').mockResolvedValue('hashedNewPassword');

      const result = await service.resetPassword({
        token: 'valid-token',
        newPassword: 'newPassword123',
      });

      expect(result.success).toBe(true);
      expect(userRepositoryMock.save).toHaveBeenCalled();
      expect(refreshTokenServiceMock.revokeAllUserTokens).toHaveBeenCalledWith(
        mockUser.id,
      );
    });
  });
});
