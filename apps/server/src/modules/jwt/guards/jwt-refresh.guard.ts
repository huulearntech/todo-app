import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtRefreshGuard extends AuthGuard('jwt-refresh') {
  canActivate(context: ExecutionContext) {
    // Luôn luôn kích hoạt xác thực refresh token, bỏ qua hoàn toàn nhãn metadata công khai
    return super.canActivate(context); 
  }
}
