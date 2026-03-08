import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';

// Import repository.
import { LogsRepository } from '../repositories/logs.repository';

@Injectable()
export class CleanUpLogsService {
    constructor(
        private readonly logsRepository: LogsRepository,
    ) { }

    // Remove all logs that older than 30 days.
    @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
    async removeAllExpiredRefreshTokens(): Promise<void> {
        Logger.log('Removing all logs that 30 days or later...');

        try {
            const removed = await this.logsRepository.deleteLogsOlderThan30Days();
            Logger.log(`Removed ${removed} expired logs.`);
        } catch (error) {
            Logger.error('Failed to remove all logs that 30 days or later.');
            Logger.error('Error in: apps/api-gateway/src/logs/services/cleanUpLogs.service.ts');
            Logger.error(`Error details: ${error}`);
        }
    }
}
