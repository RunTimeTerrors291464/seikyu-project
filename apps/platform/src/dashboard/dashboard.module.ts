import { Module } from '@nestjs/common';

// Import redis module.
import { RedisModule } from '@app/services';

// Import schedule module.
import { ScheduleModule } from '@nestjs/schedule';

// Import typeorm and entities.
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductRankingDailyEntity } from './entities/productRankingDaily.entity';
import { ProductRankingMonthlyEntity } from './entities/productRankingMonthly.entity';
import { ProductRankingYearlyEntity } from './entities/productRankingYearly.entity';

// Import controllers.
import { ProductRankingController } from './controllers/productRanking.controller';

// Import services.
import { ProductRankingService } from './services/productRanking.service';
import { ScheduleProductRankingService } from './services/scheduleProductRanking.service';

// Import repositories.
import { ProductRankingRepository } from './repositories/productRanking.repository';

// Import mappers.
import { ProductRankingMapper } from '@app/common/mappers/platform/productRanking.mapper';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            ProductRankingDailyEntity,
            ProductRankingMonthlyEntity,
            ProductRankingYearlyEntity,
        ]),

        ScheduleModule.forRoot(),

        RedisModule.forRoot({
            keyPrefix: 'platform:dashboard',
        }),
    ],
    controllers: [
        ProductRankingController,
    ],
    providers: [
        ProductRankingService,
        ScheduleProductRankingService,
        
        ProductRankingRepository,
        ProductRankingMapper,
    ],
    exports: [
        ProductRankingRepository,
    ],
})
export class DashboardModule { }
