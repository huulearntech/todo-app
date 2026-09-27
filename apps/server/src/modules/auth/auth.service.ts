import { Injectable, UnauthorizedException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import argon2 from "argon2";

import { SignInDto } from "./dto/sign-in.dto";
import { User } from "../users/user.entity";

import { RefreshTokenService } from "../jwt/refresh-token.service";
import { UserResponseDto } from "../users/dto/user.dto";


@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    private readonly refreshTokenService: RefreshTokenService,
  ) {}

  private async validateUser(email: string, password: string): Promise<UserResponseDto> {
    const user = await this.userRepository.findOne({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        avatarUrl: true,
        defaultProjectId: true,
        passwordHashed: true, // Include the hashed password for verification
      },
    });
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

  async signIn(signInDto: SignInDto): Promise<{ user: UserResponseDto, accessToken: string, refreshToken: string }> {
    const { email, password } = signInDto;
    
    const user = await this.validateUser(email, password);
    const { accessToken, refreshToken } = await this.refreshTokenService.generatePairOfTokens(user.id);

    await this.refreshTokenService.createRefreshToken(user.id, refreshToken);

    return { user, accessToken, refreshToken };
  }

  async signOut(userId: string): Promise<void> {
    await this.refreshTokenService.revokeAllUserTokens(userId);
  }
}