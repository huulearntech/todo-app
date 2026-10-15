import * as crypto from 'crypto';
import {
  Injectable,
  Logger,
  UnauthorizedException,
  BadRequestException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import argon2 from 'argon2';

import { SignInDto } from '../dto/sign-in.dto';
import { SignUpDto } from '../dto/sign-up.dto';
import { ChangePasswordDto } from '../dto/change-password.dto';
import { ResetPasswordDto } from '../dto/reset-password.dto';
import { User } from '@/src/modules/users/user.entity';
import { MagicLinkToken } from '../entities/magic-link-token.entity';
import { PasswordResetToken } from '../entities/password-reset-token.entity';
import { RefreshTokenService } from './refresh-token.service';
import { UserService } from '@/src/modules/users/user.service';
import { UserResponseDto } from '@/src/modules/users/dto/user.dto';
import { MailerSchedulerService } from '@/src/modules/mailer/services/mailer-scheduler.service';
import { TypedConfigService } from '@/src/config/typed-config.service';
import { AUTH_ERROR_CODES } from '@todo/shared';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    @InjectRepository(MagicLinkToken)
    private readonly magicLinkTokenRepository: Repository<MagicLinkToken>,
    @InjectRepository(PasswordResetToken)
    private readonly passwordResetTokenRepository: Repository<PasswordResetToken>,
    private readonly userService: UserService,
    private readonly refreshTokenService: RefreshTokenService,
    private readonly mailerSchedulerService: MailerSchedulerService,
    private readonly configService: TypedConfigService,
  ) {}

  private async validateUser(
    email: string,
    password: string,
  ): Promise<UserResponseDto> {
    const user = await this.userRepository.findOne({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        avatarUrl: true,
        defaultProjectId: true,
        passwordHashed: true, // Include the hashed password for verification
        isEmailVerified: true,
      },
    });
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordMatches = await argon2.verify(user.passwordHashed, password);
    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isEmailVerified) {
      throw new UnauthorizedException({
        code: 'EMAIL_NOT_VERIFIED',
        message:
          'Please verify your email address before signing in. Check your inbox for the verification link.',
      });
    }

    const { passwordHashed: _passwordHashed, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async signUp(
    signUpDto: SignUpDto,
  ): Promise<{ user: UserResponseDto }> {
    const user = await this.userService.createUser(signUpDto);
    try {
      await this.sendMagicLink(user.email);
    } catch (err: unknown) {
      if (
        err instanceof HttpException &&
        err.getStatus() === HttpStatus.TOO_MANY_REQUESTS
      ) {
        this.logger.log(
          `Magic link cooldown active for ${user.email} during signUp: ${err.message}`,
        );
      } else {
        throw err;
      }
    }
    return { user };
  }

  async signIn(signInDto: SignInDto): Promise<{
    user: UserResponseDto;
    accessToken: string;
    refreshToken: string;
  }> {
    const { email, password } = signInDto;

    const user = await this.validateUser(email, password);
    const { accessToken, refreshToken } =
      await this.refreshTokenService.generatePairOfTokens(user.id);

    await this.refreshTokenService.createRefreshToken(user.id, refreshToken);

    return { user, accessToken, refreshToken };
  }

  async signOut(userId: string): Promise<void> {
    await this.refreshTokenService.revokeAllUserTokens(userId);
  }

  /**
   * Request a magic link for email verification / passwordless login.
   * Enforces 60-second cooldown and max 5 requests/hour per account.
   * Generates a 32-byte secure token, stores its SHA-256 hash in DB,
   * and queues an email with the raw token link.
   */
  async sendMagicLink(
    email: string,
  ): Promise<{ success: boolean; message: string }> {
    const normalizedEmail = email.trim().toLowerCase();

    const user = await this.userRepository.findOne({
      where: { email: normalizedEmail },
    });

    if (!user) {
      this.logger.warn(
        `Magic link requested for non-existent email: ${normalizedEmail}`,
      );
      // Generic message to prevent user enumeration
      return {
        success: true,
        message:
          'If an account exists with this email, a verification link has been sent.',
      };
    }

    const now = Date.now();

    // 1. Cooldown check: minimum 60s between token requests
    const latestToken = await this.magicLinkTokenRepository.findOne({
      where: { userId: user.id },
      order: { createdAt: 'DESC' },
    });

    if (latestToken) {
      const elapsedMs = now - latestToken.createdAt.getTime();
      const COOLDOWN_MS = 60 * 1000;
      if (elapsedMs < COOLDOWN_MS) {
        const retryAfterSeconds = Math.ceil((COOLDOWN_MS - elapsedMs) / 1000);
        throw new HttpException(
          {
            message: `Please wait ${retryAfterSeconds}s before requesting another verification email.`,
            code: 'COOLDOWN_ACTIVE',
            retryAfter: retryAfterSeconds,
          },
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }
    }

    // 2. Max hourly limit check: max 5 requests per 1 hour
    const oneHourAgo = new Date(now - 60 * 60 * 1000);
    const hourlyCount = await this.magicLinkTokenRepository.count({
      where: {
        userId: user.id,
        createdAt: MoreThan(oneHourAgo),
      },
    });

    if (hourlyCount >= 5) {
      throw new HttpException(
        {
          message:
            'Too many verification email requests. Please try again in 1 hour.',
          code: 'RATE_LIMIT_EXCEEDED',
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto
      .createHash('sha256')
      .update(rawToken)
      .digest('hex');

    // Token expires in 15 minutes
    const expiresAt = new Date(now + 15 * 60 * 1000);

    // Invalidate previous unused magic link tokens for this user
    await this.magicLinkTokenRepository.update(
      { userId: user.id, isUsed: false },
      { isUsed: true },
    );

    const tokenEntity = this.magicLinkTokenRepository.create({
      tokenHash,
      userId: user.id,
      expiresAt,
      isUsed: false,
    });

    await this.magicLinkTokenRepository.save(tokenEntity);

    const frontendBaseUrl = this.configService.get('FRONTEND_URL');
    const magicLinkUrl = `${frontendBaseUrl}/auth/verify?token=${rawToken}`;

    await this.mailerSchedulerService.sendImmediateEmail({
      to: user.email,
      subject: 'Verify your Todo App account',
      templateType: 'magic-link',
      context: {
        name: user.name,
        actionUrl: magicLinkUrl,
      },
    });

    return {
      success: true,
      message:
        'If an account exists with this email, a verification link has been sent.',
    };
  }

  /**
   * Validates a raw magic link token:
   * Hashes with SHA-256, looks up in DB, checks expiration and single-use status,
   * updates isUsed=true, marks user email verified, emits verification SSE event,
   * and returns the User.
   */
  async validateMagicLinkToken(rawToken: string): Promise<User> {
    const tokenHash = crypto
      .createHash('sha256')
      .update(rawToken)
      .digest('hex');

    const tokenEntity = await this.magicLinkTokenRepository.findOne({
      where: { tokenHash },
      relations: { user: true },
    });

    if (!tokenEntity) {
      throw new UnauthorizedException(
        'This verification link has expired or has already been used.',
      );
    }

    if (tokenEntity.expiresAt.getTime() <= Date.now()) {
      throw new UnauthorizedException(
        'This verification link has expired or has already been used.',
      );
    }

    const user = tokenEntity.user;

    // Idempotency: If this token was already marked used, but the associated user
    // is verified and token has not expired, return the user safely without error.
    if (tokenEntity.isUsed) {
      if (user.isEmailVerified) {
        return user;
      }
      throw new UnauthorizedException(
        'This verification link has expired or has already been used.',
      );
    }

    tokenEntity.isUsed = true;
    await this.magicLinkTokenRepository.save(tokenEntity);

    if (!user.isEmailVerified) {
      user.isEmailVerified = true;
      await this.userRepository.save(user);

      // Now that email is verified, send the welcome email
      await this.mailerSchedulerService.sendImmediateEmail({
        to: user.email,
        subject: 'Welcome to Todo App!',
        templateType: 'welcome',
        context: {
          name: user.name,
        },
      });
    }

    return user;
  }

  /**
   * Idempotent read-only query to check current email verification status.
   */
  async checkUserEmailVerified(userId: string): Promise<boolean> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      select: { id: true, isEmailVerified: true },
    });
    return user?.isEmailVerified ?? false;
  }

  /**
   * Authenticated password change:
   * Verifies current password with argon2, rejects if new password is identical,
   * hashes new password, revokes all other refresh tokens, and issues a fresh token pair.
   */
  async changePassword(
    userId: string,
    changePasswordDto: ChangePasswordDto,
  ): Promise<{
    message: string;
    accessToken: string;
    refreshToken: string;
  }> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        passwordHashed: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const isCurrentValid = await argon2.verify(
      user.passwordHashed,
      changePasswordDto.currentPassword,
    );
    if (!isCurrentValid) {
      throw new BadRequestException({
        code: AUTH_ERROR_CODES.INVALID_CURRENT_PASSWORD,
        message: 'Current password does not match.',
      });
    }

    if (changePasswordDto.newPassword === changePasswordDto.currentPassword) {
      throw new BadRequestException({
        code: AUTH_ERROR_CODES.SAME_PASSWORD,
        message: 'New password must be different from current password.',
      });
    }

    user.passwordHashed = await argon2.hash(changePasswordDto.newPassword);
    await this.userRepository.save(user);

    // Revoke all existing sessions and issue a new token pair for the current browser
    await this.refreshTokenService.revokeAllUserTokens(userId);

    const { accessToken, refreshToken } =
      await this.refreshTokenService.generatePairOfTokens(userId);
    await this.refreshTokenService.createRefreshToken(userId, refreshToken);

    return {
      message: 'Password changed successfully.',
      accessToken,
      refreshToken,
    };
  }

  /**
   * Request password reset email:
   * Enforces 60-second cooldown and 5/hour rate limit.
   * Generates a 32-byte secure token, stores SHA-256 hash in DB,
   * and sends an email with the raw token reset URL.
   * Prevents email enumeration by returning generic success message.
   */
  async sendPasswordResetEmail(
    email: string,
  ): Promise<{ success: boolean; message: string }> {
    const normalizedEmail = email.trim().toLowerCase();

    const user = await this.userRepository.findOne({
      where: { email: normalizedEmail },
    });

    if (!user) {
      this.logger.warn(
        `Password reset requested for non-existent email: ${normalizedEmail}`,
      );
      return {
        success: true,
        message:
          'If an account exists with this email, a password reset link has been sent.',
      };
    }

    const now = Date.now();

    // 1. Cooldown check: minimum 60s between reset requests
    const latestToken = await this.passwordResetTokenRepository.findOne({
      where: { userId: user.id },
      order: { createdAt: 'DESC' },
    });

    if (latestToken) {
      const elapsedMs = now - latestToken.createdAt.getTime();
      const COOLDOWN_MS = 60 * 1000;
      if (elapsedMs < COOLDOWN_MS) {
        const retryAfterSeconds = Math.ceil((COOLDOWN_MS - elapsedMs) / 1000);
        throw new HttpException(
          {
            message: `Please wait ${retryAfterSeconds}s before requesting another password reset email.`,
            code: 'COOLDOWN_ACTIVE',
            retryAfter: retryAfterSeconds,
          },
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }
    }

    // 2. Max hourly limit check: max 5 requests per 1 hour
    const oneHourAgo = new Date(now - 60 * 60 * 1000);
    const hourlyCount = await this.passwordResetTokenRepository.count({
      where: {
        userId: user.id,
        createdAt: MoreThan(oneHourAgo),
      },
    });

    if (hourlyCount >= 5) {
      throw new HttpException(
        {
          message:
            'Too many password reset requests. Please try again in 1 hour.',
          code: 'RATE_LIMIT_EXCEEDED',
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto
      .createHash('sha256')
      .update(rawToken)
      .digest('hex');

    // Token expires in 15 minutes
    const expiresAt = new Date(now + 15 * 60 * 1000);

    // Invalidate previous unused reset tokens for this user
    await this.passwordResetTokenRepository.update(
      { userId: user.id, isUsed: false },
      { isUsed: true },
    );

    const tokenEntity = this.passwordResetTokenRepository.create({
      tokenHash,
      userId: user.id,
      expiresAt,
      isUsed: false,
    });

    await this.passwordResetTokenRepository.save(tokenEntity);

    const frontendBaseUrl = this.configService.get('FRONTEND_URL');
    const resetUrl = `${frontendBaseUrl}/auth/reset-password?token=${rawToken}`;

    await this.mailerSchedulerService.sendImmediateEmail({
      to: user.email,
      subject: 'Reset your password for Todo App',
      templateType: 'password-reset',
      context: {
        name: user.name,
        actionUrl: resetUrl,
      },
    });

    return {
      success: true,
      message:
        'If an account exists with this email, a password reset link has been sent.',
    };
  }

  /**
   * Reset password with valid token:
   * Hashes token with SHA-256, verifies valid and unexpired in DB,
   * performs atomic update to mark is_used=true, hashes new password,
   * and revokes all existing refresh tokens for the user.
   */
  async resetPassword(
    resetPasswordDto: ResetPasswordDto,
  ): Promise<{ success: boolean; message: string }> {
    const tokenHash = crypto
      .createHash('sha256')
      .update(resetPasswordDto.token)
      .digest('hex');

    const tokenEntity = await this.passwordResetTokenRepository.findOne({
      where: { tokenHash },
    });

    if (
      !tokenEntity ||
      tokenEntity.isUsed ||
      tokenEntity.expiresAt.getTime() <= Date.now()
    ) {
      throw new BadRequestException(
        'This password reset link is invalid, expired, or has already been used.',
      );
    }

    // Atomic update to mark token used and prevent race conditions
    const updateResult = await this.passwordResetTokenRepository
      .createQueryBuilder()
      .update(PasswordResetToken)
      .set({ isUsed: true })
      .where('token_hash = :tokenHash AND is_used = false AND expires_at > :now', {
        tokenHash,
        now: new Date(),
      })
      .execute();

    if (updateResult.affected === 0) {
      throw new BadRequestException(
        'This password reset link is invalid, expired, or has already been used.',
      );
    }

    const user = await this.userRepository.findOne({
      where: { id: tokenEntity.userId },
      select: {
        id: true,
        email: true,
        passwordHashed: true,
      },
    });

    if (!user) {
      throw new BadRequestException('User not found.');
    }

    user.passwordHashed = await argon2.hash(resetPasswordDto.newPassword);
    await this.userRepository.save(user);

    // Revoke all existing sessions for the account
    await this.refreshTokenService.revokeAllUserTokens(user.id);

    return {
      success: true,
      message:
        'Your password has been reset successfully. Please sign in with your new password.',
    };
  }
}

