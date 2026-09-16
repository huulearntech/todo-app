import { ExecutionContext, Injectable, ForbiddenException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
// Định nghĩa kiểu user trả về sau khi validate dựa trên cấu trúc JwtStrategy của bạn
interface AuthenticatedUser {
  id: string;
  email: string;
}

@Injectable()
export class GuestGuard extends AuthGuard('jwt') {
  override handleRequest<TUser = AuthenticatedUser>(
    err: Error | null,
    user: TUser | false,
    info: Error | undefined,
    context: ExecutionContext,
    status?: number,
  ): TUser {
    if (user) {
      throw new ForbiddenException('You are already signed in.');
    }

    return null as TUser;
  }
}
