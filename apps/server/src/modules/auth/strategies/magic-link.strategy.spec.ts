import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import type { Request } from 'express';
import { MagicLinkStrategy } from './magic-link.strategy';
import { AuthService } from '../services/auth.service';
import { User } from '@/src/modules/users/user.entity';

describe('MagicLinkStrategy', () => {
  let strategy: MagicLinkStrategy;
  let authServiceMock: Partial<jest.Mocked<AuthService>>;

  beforeEach(async () => {
    authServiceMock = {
      validateMagicLinkToken: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MagicLinkStrategy,
        {
          provide: AuthService,
          useValue: authServiceMock,
        },
      ],
    }).compile();

    strategy = module.get<MagicLinkStrategy>(MagicLinkStrategy);
  });

  it('should be defined', () => {
    expect(strategy).toBeDefined();
  });

  it('should throw UnauthorizedException if token is missing in query', async () => {
    const mockRequest = { query: {} } as unknown as Request;

    await expect(strategy.validate(mockRequest)).rejects.toThrow(
      new UnauthorizedException('Magic link token is missing'),
    );
  });

  it('should call authService.validateMagicLinkToken with query token and return user', async () => {
    const mockUser = { id: 'user-123', email: 'user@example.com' } as User;
    authServiceMock.validateMagicLinkToken!.mockResolvedValue(mockUser);

    const mockRequest = {
      query: { token: 'valid-raw-token-123' },
    } as unknown as Request;

    const result = await strategy.validate(mockRequest);

    expect(authServiceMock.validateMagicLinkToken).toHaveBeenCalledWith(
      'valid-raw-token-123',
    );
    expect(result).toBe(mockUser);
  });
});
