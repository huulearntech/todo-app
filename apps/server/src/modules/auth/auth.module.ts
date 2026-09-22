import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';

import { User } from '../users/user.entity';
import { UserModule } from '../users/user.module';

import { RefreshToken } from '../jwt/entities/refresh-token.entity';
import { JwtAccessStrategy } from '../jwt/strategies/jwt-access.strategy';
import { JwtAccessGuard } from '../jwt/guards/jwt-access.guard';
import { RefreshTokenService } from '../jwt/refresh-token.service';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt-access' }),
    JwtModule.register({
      secret: process.env.JWT_SECRET, // Must match the Strategy secret
      signOptions: { expiresIn: '900s' }, // Access token expiration time // FIX: @Consistency
    }),
    TypeOrmModule.forFeature([User, RefreshToken]),
    UserModule,
  ],
  providers: [
    AuthService,
    JwtAccessStrategy,
    {
      provide: 'APP_GUARD',
      useClass: JwtAccessGuard, // Use the JwtAuthGuard globally, public routes must be explicitly marked
    },
    RefreshTokenService,
  ],
  controllers: [AuthController],
  exports: [AuthService], // Export AuthService for use in other modules
})
export class AuthModule {}
