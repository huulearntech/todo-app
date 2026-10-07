import * as crypto from 'crypto';
import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import argon2 from 'argon2';

import { SignInDto } from '../dto/sign-in.dto';
import { SignUpDto } from '../dto/sign-up.dto';
import { User } from '@/src/modules/users/user.entity';
import { MagicLinkToken } from '../entities/magic-link-token.entity';
import { RefreshTokenService } from './refresh-token.service';
import { UserService } from '@/src/modules/users/user.service';
import { UserResponseDto } from '@/src/modules/users/dto/user.dto';
import { MailerSchedulerService } from '@/src/modules/mailer/services/mailer-scheduler.service';
import { TypedConfigService } from '@/src/config/typed-config.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    @InjectRepository(MagicLinkToken)
    private readonly magicLinkTokenRepository: Repository<MagicLinkToken>,
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

    const { passwordHashed: _passwordHashed, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async signUp(signUpDto: SignUpDto): Promise<UserResponseDto> {
    const user = await this.userService.createUser(signUpDto);
    await this.sendMagicLink(user.email);
    return user;
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

    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto
      .createHash('sha256')
      .update(rawToken)
      .digest('hex');

    // Token expires in 15 minutes
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

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

    const backendBaseUrl =
      this.configService.get('BACKEND_URL') || 'http://localhost:4000';
    const magicLinkUrl = `${backendBaseUrl}/auth/magic-link/callback?token=${rawToken}`;

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
   * Validates a raw magic link token from the callback URL:
   * Hashes with SHA-256, looks up in DB, checks expiration and single-use status,
   * updates isUsed=true, marks user email verified, and returns the User.
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
      throw new UnauthorizedException('Invalid or expired magic link token');
    }

    if (tokenEntity.isUsed) {
      throw new UnauthorizedException('Magic link token has already been used');
    }

    if (tokenEntity.expiresAt.getTime() <= Date.now()) {
      throw new UnauthorizedException('Magic link token has expired');
    }

    tokenEntity.isUsed = true;
    await this.magicLinkTokenRepository.save(tokenEntity);

    const user = tokenEntity.user;
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
}
