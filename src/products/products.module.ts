import { Module } from '@nestjs/common';

// Import the database module.
import { PostgresModule } from '@libs/services/postgres.module';
import { ProductNamesEntity } from './entities/productNames.entity';
import { ProductsEntity } from './entities/products.entity';
import { ProductStockHistoryEntity } from './entities/productStockHistory.entity';
import { ProductsHistoryEntity } from './entities/productsHistory.entity';
import { ProductOverviewEntity } from './entities/productOverview.entity';

@Module({
    imports: [
        PostgresModule.forFeature([
            ProductsEntity,
            ProductNamesEntity,
            ProductStockHistoryEntity,
            ProductsHistoryEntity,
            ProductOverviewEntity,
        ]),
    ],
})
export class ProductsModule {}
