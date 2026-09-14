import { Injectable, UnauthorizedException } from "@nestjs/common";

import { SignInDto } from "./dto/sign-in.dto";
import { UserService } from "../users/user.service";
import { type User } from "../users/user.entity";

import argon2 from "argon2";
import { RefreshTokenService } from "../jwt/refresh-token.service";

// The Strategy defines how the token is validated, while the Guard determines which routes require that validation
@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly refreshTokenService: RefreshTokenService,
  ) {} // TODO:

  // TODO: remove the temporary type patches
  private async validateUser(email: string, password: string): Promise<Omit<User, 'passwordHashed'>> {
    const user = await this.userService.findByEmailIncludePassword(email);
    if (!user) {
      throw new UnauthorizedException("Invalid credentials");
    }

    const passwordMatches = await argon2.verify(user.passwordHashed, password);
    if (!passwordMatches) {
      throw new UnauthorizedException("Invalid credentials");
    }

    const { passwordHashed, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async signIn(signInDto: SignInDto): Promise<{ user: Omit<User, 'passwordHashed'>, accessToken: string, refreshToken: string }> {
    const { email, password } = signInDto;
    
    // NOTE: this is another failure point. Damn AI bullshit.
    try {
      const user = await this.validateUser(email, password);
      const { accessToken, refreshToken } = await this.refreshTokenService.generatePairOfTokens(user.id);

      await this.refreshTokenService.createRefreshToken(user.id, refreshToken);

      return { user, accessToken, refreshToken };
    } catch (error) {
      throw new UnauthorizedException("Invalid credentials");
    }
  }
}