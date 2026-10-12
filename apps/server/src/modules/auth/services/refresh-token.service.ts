import * as crypto from 'crypto';

import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { Repository } from 'typeorm';

import { RefreshToken } from '../entities/refresh-token.entity';
import { TypedConfigService } from '@config/typed-config.service';

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

  async generatePairOfTokens(
    userId: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const accessToken = await this.jwtService.signAsync(
      { sub: userId },
      {
        expiresIn: `${this.configService.get('JWT_SECRET_EXPIRATION_SECONDS')}s`,
        secret: this.configService.get('JWT_SECRET'),
      },
    );

    const refreshToken = crypto.randomBytes(64).toString('hex');

    return { accessToken, refreshToken };
  }

  async validateAndRotateRefreshToken(oldToken: string) {
    const oldHash = this.hashToken(oldToken);
    const now = new Date();

    const existingToken = await this.tokenRepository.findOne({
      where: { token: oldHash },
    });

    if (!existingToken) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    // Reuse detection: if an already-revoked token is used again, revoke the entire token family!
    if (existingToken.isRevoked) {
      if (existingToken.familyId) {
        await this.tokenRepository.update(
          { familyId: existingToken.familyId },
          { isRevoked: true },
        );
      }
      throw new UnauthorizedException(
        'Refresh token reuse detected. All sessions in this chain have been revoked.',
      );
    }

    if (existingToken.expiresAt.getTime() <= now.getTime()) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    // Atomic rotation: mark old token as revoked only if it wasn't already revoked
    const updateResult = await this.tokenRepository
      .createQueryBuilder()
      .update(RefreshToken)
      .set({ isRevoked: true })
      .where('id = :id AND is_revoked = false', { id: existingToken.id })
      .execute();

    if (updateResult.affected === 0) {
      throw new UnauthorizedException('Refresh token already rotated');
    }

    const { accessToken, refreshToken } = await this.generatePairOfTokens(
      existingToken.userId,
    );
    const hashedNewToken = this.hashToken(refreshToken);

    const newTokenExpiresAt = new Date();
    newTokenExpiresAt.setSeconds(
      newTokenExpiresAt.getSeconds() +
        this.configService.get('JWT_REFRESH_SECRET_EXPIRATION_SECONDS'),
    );

    const newTokenEntity = this.tokenRepository.create({
      userId: existingToken.userId,
      token: hashedNewToken,
      familyId: existingToken.familyId || crypto.randomUUID(),
      expiresAt: newTokenExpiresAt,
      isRevoked: false,
    });

    await this.tokenRepository.save(newTokenEntity);

    return { accessToken, refreshToken };
  }

  async createRefreshToken(
    userId: string,
    refreshToken: string,
    familyId?: string,
  ): Promise<RefreshToken> {
    const hashedToken = this.hashToken(refreshToken);
    const expiresAt = new Date();
    expiresAt.setSeconds(
      expiresAt.getSeconds() +
        this.configService.get('JWT_REFRESH_SECRET_EXPIRATION_SECONDS'),
    );

    const tokenEntity = this.tokenRepository.create({
      userId,
      token: hashedToken,
      familyId: familyId ?? crypto.randomUUID(),
      expiresAt,
      isRevoked: false,
    });

    return this.tokenRepository.save(tokenEntity);
  }

  async revokeToken(token: string): Promise<void> {
    const hashedToken = this.hashToken(token);
    await this.tokenRepository.update(
      { token: hashedToken, isRevoked: false },
      { isRevoked: true },
    );
  }

  async revokeAllUserTokens(userId: string): Promise<void> {
    await this.tokenRepository.update(
      { userId, isRevoked: false },
      { isRevoked: true },
    );
  }
}
