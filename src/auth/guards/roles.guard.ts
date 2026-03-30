import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { HttpStatus } from '@nestjs/common';

// Import error exceptions.
import { CustomException } from '@libs/common/error-exceptions/customException';
import { ErrorCode } from '@libs/common/enums/errorCode.enum';

// Import enums.
import { Role } from '@libs/common/enums/role.enum';

// Import decorators.
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
    constructor(private reflector: Reflector) { }

    canActivate(context: ExecutionContext): boolean {
        const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);

        if (!requiredRoles) {
            return true;
        }

        const request = context.switchToHttp().getRequest();
        const user = request.user;

        if (!user || !user.roles || !Array.isArray(user.roles)) {
            throw new CustomException(HttpStatus.UNAUTHORIZED, ErrorCode.NO_ROLES_FOUND_FOR_USER, 'No roles found for user.');
        }

        const hasRequiredRole = requiredRoles.some((role) => user.roles.includes(role));

        if (!hasRequiredRole) {
            throw new CustomException(HttpStatus.FORBIDDEN, ErrorCode.REQUIRED_ROLES_NOT_FOUND, 'User does not have the required roles to access this resource.');
        }

        return true;
    }
}
