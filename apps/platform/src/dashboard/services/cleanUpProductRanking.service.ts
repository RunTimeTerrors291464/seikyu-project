import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';

// Import repository.
import { ProductRankingRepository } from '../repositories/productRanking.repository';

@Injectable()
export class CleanUpProductRankingService {
    constructor(
        private readonly productRankingRepository: ProductRankingRepository,
    ) { }

    // Remove product ranking data that are not in the top 100 daily at midnight every day.
    @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
    async removeProductRankingNotInTop100Daily(): Promise<void> {
        Logger.log('Removing product ranking not in top 100 daily...');

        try {
            // Get the current date.
            const { day, month, year } = await this.productRankingRepository.getCurrentDate();
            
            // Because this will run in the next day, so we need to remove the product ranking data of the day before.
            const currentDate = new Date(year, month - 1, day);
            const previousDate = new Date(currentDate);
            previousDate.setDate(previousDate.getDate() - 1);

            const previousDay = previousDate.getDate();
            const previousMonth = previousDate.getMonth() + 1;
            const previousYear = previousDate.getFullYear();

            const removed = await this.productRankingRepository.removeNonTop100ProductRankingDaily(previousDay, previousMonth, previousYear);
            Logger.log(`Removed ${removed} product rankings not in top 100.`);
        } catch (error) {
            Logger.error('Failed to remove product ranking not in top 100 daily.');
            Logger.error('Error in: apps/platform/src/dashboard/services/cleanUpProductRanking.service.ts');
            Logger.error(`Error details: ${error}`);
        }
    }
}
