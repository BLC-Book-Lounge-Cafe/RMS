import {
  applyDecorators,
  CanActivate,
  ExecutionContext,
  HttpStatus,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { ApiResponse } from '@nestjs/swagger';
import { Unauthorized } from './guards.errors';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractTokenFromHeader(request);
    const apiKey = this.configService.get<string>('RMS_API_KEY');

    if (!apiKey) {
      throw new UnauthorizedException(Unauthorized);
    }

    if (!token || token !== apiKey) {
      throw new UnauthorizedException(Unauthorized);
    }

    return true;
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}

export function ApiUnauthorizedResponse() {
  return applyDecorators(
    ApiResponse({
      status: HttpStatus.UNAUTHORIZED,
      content: {
        'application/json': {
          examples: {
            [Unauthorized.message]: {
              value: { error: Unauthorized },
            },
          },
        },
      },
    }),
  );
}
