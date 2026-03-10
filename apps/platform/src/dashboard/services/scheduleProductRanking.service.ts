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
}
