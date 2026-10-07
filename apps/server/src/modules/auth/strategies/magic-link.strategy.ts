import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-custom';
import type { Request } from 'express';
import { AuthService } from '../services/auth.service';
import { User } from '@/src/modules/users/user.entity';

@Injectable()
export class MagicLinkStrategy extends PassportStrategy(
  Strategy,
  'magic-link',
) {
  constructor(private readonly authService: AuthService) {
    super();
  }

  async validate(req: Request): Promise<User> {
    const rawToken = req.query?.token;
    if (!rawToken || typeof rawToken !== 'string') {
      throw new UnauthorizedException('Magic link token is missing');
    }

    return this.authService.validateMagicLinkToken(rawToken);
  }
}
