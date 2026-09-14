import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';

@Injectable()
export class RefreshTokenGuard implements CanActivate {
  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<Request>();
    const token = request.cookies['refresh_token'];

    if (!token) {
      throw new UnauthorizedException('Refresh token missing');
    }

    return true;
  }
}