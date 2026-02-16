import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { HttpStatus } from '@nestjs/common';

// Import error exceptions.
import { CustomException } from '@app/common/error-exceptions/customException';
import { ErrorCode } from '@app/common/enums/errorCode.enum';

// Import services.
import { AccessTokenService } from '../services/accessToken.service';

// Import decorators.
import { IS_PUBLIC_KEY } from './decorators/public.decorator';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
    constructor(
        private readonly accessTokenService: AccessTokenService,
        private reflector: Reflector,
    ) {
        super();
    }

    async canActivate(context: ExecutionContext): Promise<boolean> {

        // Check if route is marked as public.
        const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);
        if (isPublic) return true;

        // Validate JWT signature and structure.
        const isValidJwt = await super.canActivate(context);
        if (!isValidJwt) return false;

        // Extract user payload.
        const request = context.switchToHttp().getRequest();
        const user = request.user;

        // Check if refreshTokenId exists in payload.
        if (!user?.refreshTokenId) throw new CustomException(HttpStatus.UNAUTHORIZED, ErrorCode.INVALID_JWT_TOKEN, 'The refresh token ID is missing in access token payload.');

        // Validate refreshTokenId exists in Redis.
        try {
            const isRefreshTokenValid: boolean = await this.accessTokenService.validateRefreshTokenById(user.refreshTokenId);
            if (!isRefreshTokenValid) throw new CustomException(HttpStatus.UNAUTHORIZED, ErrorCode.INVALID_REFRESH_TOKEN, 'The access token is revoked or expired.');
        } catch (error) {
            if (error instanceof CustomException) throw error;
            throw new CustomException(HttpStatus.UNAUTHORIZED, ErrorCode.INVALID_REFRESH_TOKEN, 'The access token is revoked or expired.');
        }

        return true;
    }

    // Handle request.
    handleRequest(err: any, user: any, info: any, context: ExecutionContext) {
        if (err || !user) {
            let errorMessage = 'You are not authorized to access this resource.';

            const request = context.switchToHttp().getRequest();

            if (!request.headers?.authorization) {
                errorMessage = 'The access token is not provided.';
            }
            else if (info?.name === 'TokenExpiredError') {
                errorMessage = 'The access token has expired.';
            }
            else if (info?.name === 'JsonWebTokenError') {
                errorMessage = 'The access token is invalid.';
            }
            else if (info?.message) {
                errorMessage = info.message;
            }
            else if (err?.message) {
                errorMessage = err.message;
            }

            throw new CustomException(HttpStatus.UNAUTHORIZED, ErrorCode.INVALID_JWT_TOKEN, errorMessage);
        }

        return user;
    }
}
