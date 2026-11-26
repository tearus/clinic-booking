import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { Role } from "../../generated/prisma/enums";
import { ROLES_KEY } from "../decorators/roles.decorator";
import { AuthedRequest } from "../types/authed-request";

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!required || required.length === 0) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest<AuthedRequest>();

    if (!user || !Object.values(Role).includes(user.role)) {
      throw new ForbiddenException("Недопустимая роль");
    }

    if (!required.includes(user.role)) {
      throw new ForbiddenException("Недостаточно прав");
    }

    return true;
  }
}
