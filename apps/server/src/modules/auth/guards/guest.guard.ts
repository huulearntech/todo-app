import {
  ExecutionContext,
  Injectable,
  ForbiddenException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
// Define the user shape returned after validation based on JwtStrategy
interface AuthenticatedUser {
  id: string;
  email: string;
}

@Injectable()
export class GuestGuard extends AuthGuard('jwt-access') {
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
