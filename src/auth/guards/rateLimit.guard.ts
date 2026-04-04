import { CanActivate, ExecutionContext, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRedis } from '@nestjs-modules/ioredis';
import Redis from 'ioredis';

// Import error exceptions.
import { CustomException } from '@libs/common/error-exceptions/customException';
import { ErrorCode } from '@libs/common/enums/errorCode.enum';

// Import DTOs.
import type { AccessTokenPayload } from '@libs/common/dtos/auth/authPayload.interface';

@Injectable()
export class RateLimitGuard implements CanActivate {

    constructor(
        @InjectRedis() private readonly redisClient: Redis,
    ) { }

    // --- Private variables and methods ---
    private readonly ApiRateLimitBanPrefix: string = 'auth:RL:ban:';
    private readonly ApiRateLimitWindowPrefix: string = 'auth:RL:sec:';
    private readonly MaxRequestsPerSecond: number = 10;
    private readonly WindowKeyTtlSeconds: number = 2;
    private readonly BanDurationSeconds: number = 5 * 60;

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();
        const user = request.user as AccessTokenPayload | undefined;

        if (!user?.id) {
            throw new CustomException(HttpStatus.UNAUTHORIZED, ErrorCode.INVALID_JWT_TOKEN, 'User identity is required for rate limiting.');
        }

        const userId = user.id;

        // Check if user is temporarily banned after exceeding the rate limit.
        const banKey = `${this.ApiRateLimitBanPrefix}${userId}`;
        const isBanned = await this.redisClient.get(banKey);
        if (isBanned) {
            throw new CustomException(HttpStatus.TOO_MANY_REQUESTS, ErrorCode.RATE_LIMIT_EXCEEDED, 'You have exceeded the rate limit. Access is blocked for 5 minutes.');
        }

        // Count requests in the current one-second window (fixed window per Unix second).
        const currentSecond = Math.floor(Date.now() / 1000);
        const windowKey = `${this.ApiRateLimitWindowPrefix}${userId}:${currentSecond}`;
        const requestCount = await this.redisClient.incr(windowKey);

        if (requestCount === 1) {
            await this.redisClient.expire(windowKey, this.WindowKeyTtlSeconds);
        }

        if (requestCount > this.MaxRequestsPerSecond) {
            await this.redisClient.set(banKey, '1', 'EX', this.BanDurationSeconds);
            throw new CustomException(HttpStatus.TOO_MANY_REQUESTS, ErrorCode.RATE_LIMIT_EXCEEDED, 'Rate limit exceeded. Your access is blocked for 5 minutes.');
        }

        return true;
    }
}
