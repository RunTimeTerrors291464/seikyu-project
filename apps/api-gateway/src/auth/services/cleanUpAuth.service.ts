import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';

// Import repository.
import { RefreshTokenRepository } from '../repositories/refreshToken.repository';

@Injectable()
export class CleanUpAuthService {
    constructor(
        private readonly refreshTokenRepository: RefreshTokenRepository,
    ) { }

    // Remove all expired refresh tokens once a day at midnight.
    @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
    async removeAllExpiredRefreshTokens(): Promise<void> {
        Logger.log('Removing all expired refresh tokens...');

        try {
            const removed = await this.refreshTokenRepository.removeAllExpiredRefreshTokens();
            Logger.log(`Removed ${removed} expired refresh tokens.`);
        } catch (error) {
            Logger.error('Failed to remove all expired refresh tokens.');
            Logger.error('Error in: apps/api-gateway/src/auth/services/cleanUpAuth.service.ts/removeAllExpiredRefreshTokens');
            Logger.error(`Error details: ${error}`);
        }
    }
}
