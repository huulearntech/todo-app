import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { MoreThan, Repository } from 'typeorm';

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


  async validateAndRotateRefreshToken(oldToken: string) {
    const oldHash = this.hashToken(oldToken);
    const now = new Date();
    
    // Find old token and revoke.
    const oldTokenEntity = await this.tokenRepository.findOne({
      where: {
        token: oldHash,
        isRevoked: false,
        expiresAt: MoreThan(now),
      },
    });

    if (!oldTokenEntity) {
      console.log('Invalid or expired refresh token:', oldToken);
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    oldTokenEntity.isRevoked = true;

    // Generate new pair of tokens
    const { accessToken, refreshToken } = await this.generatePairOfTokens(oldTokenEntity.userId);
    const hashedNewToken = this.hashToken(refreshToken);

    const newTokenExpiresAt = new Date();
    newTokenExpiresAt.setSeconds(now.getSeconds() +
      this.configService.get('JWT_REFRESH_SECRET_EXPIRATION_SECONDS'));

    const newTokenEntity = this.tokenRepository.create({
      userId: oldTokenEntity.userId,
      token: hashedNewToken,
      expiresAt: newTokenExpiresAt,
      isRevoked: false,
    });

    // Update old token and save new token
    await this.tokenRepository.save([
      oldTokenEntity,
      newTokenEntity,
    ])
    
    return { accessToken, refreshToken };
  }

  async revokeAllUserTokens(userId: string) {
    await this.tokenRepository.update({ userId, isRevoked: false }, { isRevoked: true });
  }
}
