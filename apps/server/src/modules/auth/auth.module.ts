import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { AuthService } from './services/auth.service';
import { AuthController } from './auth.controller';

import { User } from '../users/user.entity';
import { UserModule } from '../users/user.module';

import { RefreshToken } from './entities/refresh-token.entity';
import { MagicLinkToken } from './entities/magic-link-token.entity';
import { JwtAccessStrategy } from './strategies/jwt-access.strategy';
import { MagicLinkStrategy } from './strategies/magic-link.strategy';
import { JwtAccessGuard } from './guards/jwt-access.guard';
import { MagicLinkGuard } from './guards/magic-link.guard';
import { RefreshTokenService } from './services/refresh-token.service';
import { MailerModule } from '../mailer/mailer.module';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt-access' }),
    JwtModule.register({
      secret: process.env.JWT_SECRET, // Must match the Strategy secret
      signOptions: { expiresIn: '900s' }, // Access token expiration time // FIX: @Consistency
    }),
    TypeOrmModule.forFeature([User, RefreshToken, MagicLinkToken]),
    UserModule,
    MailerModule,
  ],
  providers: [
    AuthService,
    JwtAccessStrategy,
    MagicLinkStrategy,
    MagicLinkGuard,
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
