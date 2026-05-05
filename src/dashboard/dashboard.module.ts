import { Module } from '@nestjs/common';

import { PostgresModule } from '@libs/services/postgres.module';
import { AuthModule } from '@src/auth/auth.module';

import { ProductRankingDailyEntity } from './entities/productRankingDaily.entity';
import { ProductRankingMonthlyEntity } from './entities/productRankingMonthly.entity';
import { ProductRankingYearlyEntity } from './entities/productRankingYearly.entity';

import { ProductRankingController } from './controllers/productRanking.controller';
import { ProductRankingService } from './services/productRanking.service';
import { ScheduleProductRankingService } from './services/scheduleProductRanking.service';
import { ProductRankingRepository } from './repositories/productRanking.repository';
import { ProductRankingMapper } from '@libs/common/mappers/dashboard/productRanking.mapper';

@Module({
    imports: [
        AuthModule,
        PostgresModule.forFeature([
            ProductRankingDailyEntity,
            ProductRankingMonthlyEntity,
            ProductRankingYearlyEntity,
        ]),
    ],
    controllers: [ProductRankingController],
    providers: [
        ProductRankingMapper,
        ProductRankingRepository,
        ProductRankingService,
        ScheduleProductRankingService,
    ],
    exports: [ProductRankingRepository],
})
export class DashboardModule { }
