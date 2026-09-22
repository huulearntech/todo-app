import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { Repository } from 'typeorm';

import { RefreshToken } from './entities/refresh-token.entity';

import * as crypto from 'crypto';
import { TypedConfigService } from '../../config/typed-config.service';

// NOTE: This does not handle the case where a user has multiple refresh tokens (e.g., from different devices). In a real-world application, you might want to associate refresh tokens with specific devices or sessions and handle them accordingly.
@Injectable()
export class RefreshTokenService {
  constructor(
    @InjectRepository(RefreshToken)
    private readonly tokenRepository: Repository<RefreshToken>,

    private readonly jwtService: JwtService,
    private readonly configService: TypedConfigService,
  ) {}

  // Helper to hash tokens before DB operations
  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  async generatePairOfTokens(userId: string): Promise<{ accessToken: string; refreshToken: string }> {
    const accessToken = await this.jwtService.signAsync(
      { sub: userId },
      {
        expiresIn: `${this.configService.get('JWT_SECRET_EXPIRATION_SECONDS')}s`,
        secret: this.configService.get('JWT_SECRET'),
      }
    );

    const refreshToken = crypto.randomBytes(64).toString('hex');

    return { accessToken, refreshToken };
  }

  // NOTE: too much failure points. Need to refactor.
  async validateAndRotateRefreshToken(oldToken: string) {
    const oldHash = this.hashToken(oldToken);
    
    const record = await this.tokenRepository.findOne({
      where: { token: oldHash, isRevoked: false }, // NOTE: if revoked, may be someone is trying to hack
    });

    // 1. Check if token exists, is expired, or already revoked
    if (!record || record.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    // 2. Revoke the old token (Token Rotation)
    record.isRevoked = true;

    const { accessToken, refreshToken } = await this.generatePairOfTokens(record.userId);
    const hashedNewToken = this.hashToken(refreshToken);

    const newTokenExpiresAt = new Date();
    newTokenExpiresAt.setSeconds(newTokenExpiresAt.getSeconds() +
      this.configService.get('JWT_REFRESH_SECRET_EXPIRATION_SECONDS'));

    await this.tokenRepository.manager.transaction(async (transactionalEntityManager) => {
      await transactionalEntityManager.save(RefreshToken, record);
      await transactionalEntityManager.save(RefreshToken, {
        userId: record.userId,
        token: hashedNewToken,
        expiresAt: newTokenExpiresAt,
        isRevoked: false,
      });
    })
    
    return { accessToken, refreshToken }; // TODO: handle errors
  }

  // TODO: @Temporary @Cleanup @Robustness
  async createRefreshToken(userId: string, refreshToken: string) {
    const hashedToken = this.hashToken(refreshToken);
    const expiresAt = new Date();
    expiresAt.setSeconds(expiresAt.getSeconds() +
      this.configService.get('JWT_REFRESH_SECRET_EXPIRATION_SECONDS'));

    const tokenEntity = this.tokenRepository.create({
      userId,
      token: hashedToken,
      expiresAt,
      isRevoked: false,
    });

    await this.tokenRepository.save(tokenEntity);
  }

  // NOTE: not handle multiple refresh tokens yet
  async revokeAllUserTokens(userId: string) {
    await this.tokenRepository.update({ userId, isRevoked: false }, { isRevoked: true });
  }
}
