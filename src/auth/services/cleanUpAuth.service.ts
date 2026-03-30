import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';

// Import repository.
import { AuthRepository } from '../repositories/auth.repository';

@Injectable()
export class CleanUpAuthService {
    constructor(
        private readonly authRepository: AuthRepository,
    ) { }

    // Remove all expired refresh tokens once a day at midnight.
    @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
    async removeAllExpiredRefreshTokens(): Promise<void> {
        Logger.log('Removing all expired refresh tokens...');

        try {
            const removed = await this.authRepository.removeAllExpiredRefreshTokens();
            Logger.log(`Removed ${removed} expired refresh tokens.`);
        } catch (error) {
            Logger.error('Failed to remove all expired refresh tokens.');
            Logger.error('Error in: src/auth/services/cleanUpAuth.service.ts/removeAllExpiredRefreshTokens');
            Logger.error(`Error details: ${error}`);
        }
    }
}
