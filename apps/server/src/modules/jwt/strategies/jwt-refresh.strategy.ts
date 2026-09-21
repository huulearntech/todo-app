import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { Request } from 'express';
import { TypedConfigService } from '@config/typed-config.service';

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(Strategy, 'jwt-refresh') { // Đặt tên là 'jwt-refresh'
  constructor(configService: TypedConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: Request) => request?.cookies?.['refresh_token'] || null,
      ]),
      ignoreExpiration: false,
      secretOrKey: configService.get('JWT_REFRESH_SECRET'),
      passReqToCallback: true, // Cho phép truyền request vào hàm validate bên dưới
    });
  }

  async validate(request: Request, payload: any) {
    const refreshToken = request.cookies['refresh_token'];
    
    // Trả về thông tin user kèm token gốc để tiện xử lý so khớp ở Service
    return { 
      userId: payload.sub, 
      username: payload.username,
      refreshToken 
    };
  }
}
