import { Body, Controller, Get, Post, Req, Res, UseGuards } from "@nestjs/common";
import { AuthService } from "./auth.service";
import type { Response, Request } from "express";

import { SignInDto } from "./dto/sign-in.dto";
import { SignUpDto } from "./dto/sign-up.dto";


import { Public } from "./decorators/public.decorator";
import { CurrentUser, type JwtUser } from "./decorators/current-user.decorator";

import { TypedConfigService } from "../../config/typed-config.service";
import { RefreshTokenGuard } from "../jwt/guards/refresh-token.guard";
import { UserService } from "../users/user.service";
import { RefreshTokenService } from "../jwt/refresh-token.service";
import { GuestGuard } from "../jwt/guards/guest.guard";


@Controller("auth")
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService,
    private readonly refreshTokenService: RefreshTokenService, // TODO: Should this be emmbeded in this auth service @Cleanup
    private readonly configService: TypedConfigService,
  ) {}

  @Public()
  @UseGuards(GuestGuard)
  @Post("sign-up")
  async signUp(@Body() signUpDto: SignUpDto) {
    const user = await this.userService.createUser(signUpDto);
    return user;
  }


  @Public()
  @UseGuards(GuestGuard)
  @Post("sign-in")
  async signIn(
    @Body() signInDto: SignInDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    // Validate credentials and generate tokens inside service
    const { accessToken, refreshToken, user } = await this.authService.signIn(signInDto);

    // 2. Set Refresh Token Cookie
    response.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: this.configService.get('JWT_REFRESH_SECRET_EXPIRATION_SECONDS') * 1000, // Convert seconds to milliseconds
      path: '/auth/refresh-token', // Restrict cookie to refresh token endpoint
    });

    // 3. Set Access Token Cookie
    response.cookie('access_token', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: this.configService.get('JWT_SECRET_EXPIRATION_SECONDS') * 1000, // Convert seconds to milliseconds
      path: '/',
    });


    // 4. Return user profile data or a success flag back as JSON
    return {
      email: user.email,
      name: user.name,
      avatarUrl: user.avatarUrl,
      defaultProjectId: user.defaultProjectId,
    };
  }

  @Post("sign-out")
  async signOut(
    @CurrentUser() user: JwtUser,
    @Res({ passthrough: true }) response: Response
  ) {
    await this.authService.signOut(user.id);

    response.clearCookie("refresh_token", {
      httpOnly: true,
      sameSite: "lax",
      secure: true,
      path: "/auth/refresh-token",
    });

    response.clearCookie("access_token", {
      httpOnly: true,
      sameSite: "lax",
      secure: true,
      path: "/",
    });

    return { message: "Signed out" };
  }

  @Public()
  @UseGuards(RefreshTokenGuard)
  @Post("refresh-token")
  async refreshToken(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const oldRefreshToken = request.cookies['refresh_token'];

    // 1. Validate Refresh Token and generate new tokens inside service
    const { accessToken, refreshToken: newRefreshToken } =
      await this.refreshTokenService.validateAndRotateRefreshToken(oldRefreshToken);

    // 2. Set new Refresh Token Cookie
    response.cookie('refresh_token', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: this.configService.get('JWT_REFRESH_SECRET_EXPIRATION_SECONDS') * 1000, // Convert seconds to milliseconds
      path: '/auth/refresh-token', // Restrict cookie to refresh token endpoint
    });

    // 3. Set new Access Token Cookie
    response.cookie('access_token', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: this.configService.get('JWT_SECRET_EXPIRATION_SECONDS') * 1000, // Convert seconds to milliseconds
      path: '/',
    });
    
    return { accessToken };
  }

  @Get("me")
  async getCurrentUser(
    @CurrentUser() jwtUser: JwtUser,
  ) {
    const dbUser = await this.userService.findById(jwtUser.id);
    if (!dbUser) {
      return { message: 'User not found' };
    }

    // Exclude sensitive fields like passwordHashed before returning // May declare @Exclude() but it might be error-prone if we use custom queries.
    const { passwordHashed, ...userWithoutPassword } = dbUser;
    return userWithoutPassword;
  }
}