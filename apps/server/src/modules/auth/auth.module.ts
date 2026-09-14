import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';

import { User } from '../users/user.entity';
import { UserModule } from '../users/user.module';

import { RefreshToken } from '../jwt/entities/refresh-token.entity';
import { JwtStrategy } from '../jwt/strategies/jwt.strategy';
import { JwtAuthGuard } from '../jwt/guards/jwt-auth.guard';
import { RefreshTokenService } from '../jwt/refresh-token.service';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: process.env.JWT_SECRET, // Must match the Strategy secret
      signOptions: { expiresIn: '15m' }, // Access token expiration time // FIX: @Consistency
    }),
    JwtModule.register({
      secret: process.env.JWT_REFRESH_SECRET,
      signOptions: { expiresIn: '7d' }, // Refresh token expiration time // FIX: @Consistency
    }),
    TypeOrmModule.forFeature([User, RefreshToken]),
    UserModule,
  ],
  providers: [
    AuthService,
    JwtStrategy,
    {
      provide: 'APP_GUARD',
      useClass: JwtAuthGuard, // Use the JwtAuthGuard globally, public routes must be explicitly marked
    },
    RefreshTokenService, // Add RefreshTokenService to providers
  ], // Add JwtStrategy to providers
  controllers: [AuthController],
  exports: [AuthService], // Export AuthService for use in other modules
})
export class AuthModule {}
