import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

// TODO: manage the import paths
// import { ConfigService } from '@nestjs/config';
import { TypedConfigService } from '../../../config/typed-config.service'; // Use the typed ConfigService
import { JwtPayload } from '../interfaces/jwt.interface';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: TypedConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get('JWT_SECRET'),
    });
  }

  async validate(payload: JwtPayload) {
    // Whatever is returned here is automatically attached to req.user
    return { id: payload.sub, email: payload.email };
  }
}
