import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { JwtPayload } from "../types/jwt-payload";
import { AuthedRequest } from "../types/authed-request";

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AuthedRequest>();

    const token = this.extractToken(request);
    if (!token) {
      throw new UnauthorizedException('Требуется авторизация');
    }

    try {
      request.user = this.jwtService.verify<JwtPayload>(token);
    } catch {
      throw new UnauthorizedException('Недействительный токен');
    }
    return true;
  }

  private extractToken(request: AuthedRequest): string | undefined {
    const [scheme, token] =
      request.header('authorization')?.trim().split(/\s+/) ?? [];
    return scheme?.toLowerCase() === 'bearer' ? token : undefined;
  }
}
