import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';

// Import repository.
import { ProductRankingRepository } from '../repositories/productRanking.repository';

// Import enums.
import { InvoiceType } from '@app/common/enums/invoiceType.enum';

@Injectable()
export class ScheduleProductRankingService {
    constructor(
        private readonly productRankingRepository: ProductRankingRepository,
    ) { }

    // Calculate and store product ranking daily every 30 minutes.
    @Cron(CronExpression.EVERY_30_MINUTES)
    async calculateAndStoreProductRankingDaily(): Promise<void> {
        Logger.log('Calculating and storing product ranking daily...');

        try {
            // Get the current date.
            const { day, month, year } = await this.productRankingRepository.getCurrentDate();
            
            // Calculate and store product ranking daily for all invoice types.
            await Promise.all([
                this.productRankingRepository.cacheTop100ProductsDaily(InvoiceType.IMPORT, day, month, year),
                this.productRankingRepository.cacheTop100ProductsDaily(InvoiceType.RETURN_IMPORT, day, month, year),
                this.productRankingRepository.cacheTop100ProductsDaily(InvoiceType.SELLING, day, month, year),
                this.productRankingRepository.cacheTop100ProductsDaily(InvoiceType.RETURN_SELLING, day, month, year),
                this.productRankingRepository.cacheTop100ProductsDaily(InvoiceType.STOCK_ADJUSTMENT, day, month, year),
            ]);

            Logger.log(`Calculated and stored product rankings for all invoice types.`);
        } catch (error) {
            Logger.error('Failed to calculate and store product ranking daily.');
            Logger.error('Error in: apps/platform/src/dashboard/services/scheduleProductRanking.service.ts');
            Logger.error(`Error details: ${error}`);
        }
    }

    // Calculate and store product ranking monthly after the daily ranking has been calculated.
    @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
    async calculateAndStoreProductRankingMonthly(): Promise<void> {
        Logger.log('Calculating and storing product ranking monthly...');

        try {
            // Get the current date.
            const { day, month, year } = await this.productRankingRepository.getCurrentDate();

            // Set the previous date to calculate.
            const currentDate = new Date(year, month - 1, day);
            const previousDate = new Date(currentDate);
            previousDate.setDate(previousDate.getDate() - 1);

            const previousDay = previousDate.getDate();
            const previousMonth = previousDate.getMonth() + 1;
            const previousYear = previousDate.getFullYear();

            // Calculate and store monthly ranking for all invoice types.
            await Promise.all([
                this.productRankingRepository.storeProductRankingMonthly(InvoiceType.IMPORT, previousDay, previousMonth, previousYear),
                this.productRankingRepository.storeProductRankingMonthly(InvoiceType.RETURN_IMPORT, previousDay, previousMonth, previousYear),
                this.productRankingRepository.storeProductRankingMonthly(InvoiceType.SELLING, previousDay, previousMonth, previousYear),
                this.productRankingRepository.storeProductRankingMonthly(InvoiceType.RETURN_SELLING, previousDay, previousMonth, previousYear),
                this.productRankingRepository.storeProductRankingMonthly(InvoiceType.STOCK_ADJUSTMENT, previousDay, previousMonth, previousYear),
            ]);

            // Keep top 100 daily rankings per invoice type for the previous day.
            const removedByType = await Promise.all([
                this.productRankingRepository.removeNonTop100ProductRankingDaily(InvoiceType.IMPORT, previousDay, previousMonth, previousYear),
                this.productRankingRepository.removeNonTop100ProductRankingDaily(InvoiceType.RETURN_IMPORT, previousDay, previousMonth, previousYear),
                this.productRankingRepository.removeNonTop100ProductRankingDaily(InvoiceType.SELLING, previousDay, previousMonth, previousYear),
                this.productRankingRepository.removeNonTop100ProductRankingDaily(InvoiceType.RETURN_SELLING, previousDay, previousMonth, previousYear),
                this.productRankingRepository.removeNonTop100ProductRankingDaily(InvoiceType.STOCK_ADJUSTMENT, previousDay, previousMonth, previousYear),
            ]);

            // Refresh daily cache after cleanup for the previous day.
            await Promise.all([
                this.productRankingRepository.cacheTop100ProductsDaily(InvoiceType.IMPORT, previousDay, previousMonth, previousYear),
                this.productRankingRepository.cacheTop100ProductsDaily(InvoiceType.RETURN_IMPORT, previousDay, previousMonth, previousYear),
                this.productRankingRepository.cacheTop100ProductsDaily(InvoiceType.SELLING, previousDay, previousMonth, previousYear),
                this.productRankingRepository.cacheTop100ProductsDaily(InvoiceType.RETURN_SELLING, previousDay, previousMonth, previousYear),
                this.productRankingRepository.cacheTop100ProductsDaily(InvoiceType.STOCK_ADJUSTMENT, previousDay, previousMonth, previousYear),
            ]);

            const removed = removedByType.reduce((sum, current) => sum + current, 0);

            Logger.log(`Calculated monthly product rankings for all invoice types and removed ${removed} non-top-100 daily rankings.`);
        } catch (error) {
            Logger.error('Failed to calculate and store product ranking monthly.');
            Logger.error('Error in: apps/platform/src/dashboard/services/scheduleProductRanking.service.ts');
            Logger.error(`Error details: ${error}`);
        }
    }

    // Calculate and store product ranking yearly when moving to a new month.
    @Cron('0 0 1 * *')
    async calculateAndStoreProductRankingYearly(): Promise<void> {
        Logger.log('Calculating and storing product ranking yearly...');

        try {
            // Get the current date.
            const { month, year } = await this.productRankingRepository.getCurrentDate();

            // Calculate yearly ranking from the previous month data.
            const currentMonthDate = new Date(year, month - 1, 1);
            currentMonthDate.setDate(0);

            const previousMonth = currentMonthDate.getMonth() + 1;
            const previousYear = currentMonthDate.getFullYear();

            // Calculate and store yearly ranking for all invoice types.
            await Promise.all([
                this.productRankingRepository.storeProductRankingYearly(InvoiceType.IMPORT, previousMonth, previousYear),
                this.productRankingRepository.storeProductRankingYearly(InvoiceType.RETURN_IMPORT, previousMonth, previousYear),
                this.productRankingRepository.storeProductRankingYearly(InvoiceType.SELLING, previousMonth, previousYear),
                this.productRankingRepository.storeProductRankingYearly(InvoiceType.RETURN_SELLING, previousMonth, previousYear),
                this.productRankingRepository.storeProductRankingYearly(InvoiceType.STOCK_ADJUSTMENT, previousMonth, previousYear),
            ]);

            // Keep top 100 monthly rankings per invoice type for the previous month.
            const removedByType = await Promise.all([
                this.productRankingRepository.removeNonTop100ProductRankingMonthly(InvoiceType.IMPORT, previousMonth, previousYear),
                this.productRankingRepository.removeNonTop100ProductRankingMonthly(InvoiceType.RETURN_IMPORT, previousMonth, previousYear),
                this.productRankingRepository.removeNonTop100ProductRankingMonthly(InvoiceType.SELLING, previousMonth, previousYear),
                this.productRankingRepository.removeNonTop100ProductRankingMonthly(InvoiceType.RETURN_SELLING, previousMonth, previousYear),
                this.productRankingRepository.removeNonTop100ProductRankingMonthly(InvoiceType.STOCK_ADJUSTMENT, previousMonth, previousYear),
            ]);

            // Refresh monthly cache after cleanup for the previous month.
            await Promise.all([
                this.productRankingRepository.cacheTop100ProductsMonthly(InvoiceType.IMPORT, previousMonth, previousYear),
                this.productRankingRepository.cacheTop100ProductsMonthly(InvoiceType.RETURN_IMPORT, previousMonth, previousYear),
                this.productRankingRepository.cacheTop100ProductsMonthly(InvoiceType.SELLING, previousMonth, previousYear),
                this.productRankingRepository.cacheTop100ProductsMonthly(InvoiceType.RETURN_SELLING, previousMonth, previousYear),
                this.productRankingRepository.cacheTop100ProductsMonthly(InvoiceType.STOCK_ADJUSTMENT, previousMonth, previousYear),
            ]);

            const removed = removedByType.reduce((sum, current) => sum + current, 0);

            Logger.log(`Calculated yearly product rankings for all invoice types and removed ${removed} non-top-100 monthly rankings.`);
        } catch (error) {
            Logger.error('Failed to calculate and store product ranking yearly.');
            Logger.error('Error in: apps/platform/src/dashboard/services/scheduleProductRanking.service.ts');
            Logger.error(`Error details: ${error}`);
        }
    }

    // Remove yearly rankings that are not in top 100 when moving to a new year.
    @Cron('0 0 1 1 *')
    async removeNonTop100ProductRankingYearly(): Promise<void> {
        Logger.log('Removing non-top-100 yearly product rankings...');

        try {
            // Get the current date and derive the previous year.
            const { year } = await this.productRankingRepository.getCurrentDate();
            const previousYear = year - 1;

            const removedByType = await Promise.all([
                this.productRankingRepository.removeNonTop100ProductRankingYearly(InvoiceType.IMPORT, previousYear),
                this.productRankingRepository.removeNonTop100ProductRankingYearly(InvoiceType.RETURN_IMPORT, previousYear),
                this.productRankingRepository.removeNonTop100ProductRankingYearly(InvoiceType.SELLING, previousYear),
                this.productRankingRepository.removeNonTop100ProductRankingYearly(InvoiceType.RETURN_SELLING, previousYear),
                this.productRankingRepository.removeNonTop100ProductRankingYearly(InvoiceType.STOCK_ADJUSTMENT, previousYear),
            ]);

            // Refresh yearly cache after cleanup for the previous year.
            await Promise.all([
                this.productRankingRepository.cacheTop100ProductsYearly(InvoiceType.IMPORT, previousYear),
                this.productRankingRepository.cacheTop100ProductsYearly(InvoiceType.RETURN_IMPORT, previousYear),
                this.productRankingRepository.cacheTop100ProductsYearly(InvoiceType.SELLING, previousYear),
                this.productRankingRepository.cacheTop100ProductsYearly(InvoiceType.RETURN_SELLING, previousYear),
                this.productRankingRepository.cacheTop100ProductsYearly(InvoiceType.STOCK_ADJUSTMENT, previousYear),
            ]);

            const removed = removedByType.reduce((sum, current) => sum + current, 0);

            Logger.log(`Removed ${removed} non-top-100 yearly product rankings for year ${previousYear}.`);
        } catch (error) {
            Logger.error('Failed to remove non-top-100 yearly product rankings.');
            Logger.error('Error in: apps/platform/src/dashboard/services/scheduleProductRanking.service.ts');
            Logger.error(`Error details: ${error}`);
        }
    }
}
