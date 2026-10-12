import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './services/auth.service';
import type { Response, Request } from 'express';

import { SignInDto } from './dto/sign-in.dto';
import { SignUpDto } from './dto/sign-up.dto';
import {
  MagicLinkRequestDto,
  MagicLinkVerifyDto,
} from './dto/magic-link-request.dto';

import { Public } from './decorators/public.decorator';
import { CurrentUser, type JwtUser } from './decorators/current-user.decorator';

import { TypedConfigService } from '../../config/typed-config.service';
import { RefreshTokenGuard } from './guards/refresh-token.guard';
import { UserService } from '../users/user.service';
import { RefreshTokenService } from './services/refresh-token.service';
import { GuestGuard } from './guards/guest.guard';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService,
    private readonly refreshTokenService: RefreshTokenService,
    private readonly configService: TypedConfigService,
  ) {}

  @Public()
  @UseGuards(GuestGuard)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('sign-up')
  async signUp(@Body() signUpDto: SignUpDto) {
    const user = await this.authService.signUp(signUpDto);
    return user;
  }

  private setAuthCookies(
    response: Response,
    accessToken: string,
    refreshToken: string,
  ) {
    const isProduction = process.env.NODE_ENV === 'production';

    response.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      maxAge:
        this.configService.get('JWT_REFRESH_SECRET_EXPIRATION_SECONDS') * 1000,
      path: '/auth/refresh-token',
    });

    response.cookie('access_token', accessToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      maxAge: this.configService.get('JWT_SECRET_EXPIRATION_SECONDS') * 1000,
      path: '/',
    });
  }

  private clearAuthCookies(response: Response) {
    const isProduction = process.env.NODE_ENV === 'production';

    response.clearCookie('refresh_token', {
      httpOnly: true,
      sameSite: 'lax',
      secure: isProduction,
      path: '/auth/refresh-token',
    });

    response.clearCookie('access_token', {
      httpOnly: true,
      sameSite: 'lax',
      secure: isProduction,
      path: '/',
    });
  }

  @Public()
  @UseGuards(GuestGuard)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('sign-in')
  async signIn(
    @Body() signInDto: SignInDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    // Validate credentials and generate tokens inside service
    const { accessToken, refreshToken, user } =
      await this.authService.signIn(signInDto);

    this.setAuthCookies(response, accessToken, refreshToken);

    // Return user profile data back as JSON
    return user;
  }

  @Post('sign-out')
  async signOut(
    @CurrentUser() user: JwtUser,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const refreshToken = request.cookies?.['refresh_token'];
    if (refreshToken) {
      await this.refreshTokenService.revokeToken(refreshToken);
    } else {
      await this.authService.signOut(user.id);
    }
    this.clearAuthCookies(response);
    return { message: 'Signed out' };
  }

  @Public()
  @UseGuards(RefreshTokenGuard)
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  @Post('refresh-token')
  async refreshToken(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const oldRefreshToken = request.cookies['refresh_token'];

    // 1. Validate Refresh Token and generate new tokens inside service
    const { accessToken, refreshToken: newRefreshToken } =
      await this.refreshTokenService.validateAndRotateRefreshToken(
        oldRefreshToken,
      );

    this.setAuthCookies(response, accessToken, newRefreshToken);

    return { success: true };
  }

  @Public()
  @UseGuards(GuestGuard)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('magic-link')
  async requestMagicLink(@Body() body: MagicLinkRequestDto) {
    return this.authService.sendMagicLink(body.email);
  }

  /**
   * Legacy / direct GET callback from email scanner protection:
   * Do NOT consume or invalidate the token on GET. Redirect to frontend landing page.
   */
  @Public()
  @Get('magic-link/callback')
  async magicLinkCallback(@Req() request: Request, @Res() response: Response) {
    const token = request.query?.['token'];
    const frontendBaseUrl =
      this.configService.get('FRONTEND_URL') || 'http://localhost:3000';
    return response.redirect(
      `${frontendBaseUrl}/auth/verify?token=${encodeURIComponent(String(token || ''))}`,
    );
  }

  /**
   * Explicit POST verification from frontend landing page.
   * Consumes token and sets authentication cookies.
   */
  @Public()
  @UseGuards(GuestGuard)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('magic-link/verify')
  async verifyMagicLink(
    @Body() body: MagicLinkVerifyDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const user = await this.authService.validateMagicLinkToken(body.token);

    const { accessToken, refreshToken } =
      await this.refreshTokenService.generatePairOfTokens(user.id);
    await this.refreshTokenService.createRefreshToken(user.id, refreshToken);

    this.setAuthCookies(response, accessToken, refreshToken);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatarUrl,
        defaultProjectId: user.defaultProjectId,
        isEmailVerified: user.isEmailVerified,
      },
    };
  }

  @Get('me')
  async getCurrentUser(@CurrentUser() jwtUser: JwtUser) {
    return this.userService.findById(jwtUser.id);
  }
}
