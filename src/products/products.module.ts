import { Module } from '@nestjs/common';

// Import the database module.
import { PostgresModule } from '@libs/services/postgres.module';

// Import modules.
import { AuthModule } from '../auth/auth.module';
import { ProductUnitsModule } from '../productUnits/productUnits.module';

// Import mappers.
import { ProductMapper } from '@libs/common/mappers/product.mapper';

// Import entities.
import { ProductNamesEntity } from './entities/productNames.entity';
import { ProductsEntity } from './entities/products.entity';
import { ProductStockHistoryEntity } from './entities/productStockHistory.entity';
import { ProductsHistoryEntity } from './entities/productsHistory.entity';
import { ProductOverviewEntity } from './entities/productOverview.entity';

// Import repositories.
import { ProductsRepository } from './repositories/products.repository';

// Import services.
import { ProductsService } from './services/products.service';

// Import controllers.
import { ProductsController } from './controllers/products.controller';

@Module({
    imports: [
        PostgresModule.forFeature([
            ProductsEntity,
            ProductNamesEntity,
            ProductStockHistoryEntity,
            ProductsHistoryEntity,
            ProductOverviewEntity,
        ]),
        AuthModule,
        ProductUnitsModule,
    ],
    controllers: [
        ProductsController,
    ],
    providers: [
        ProductMapper,
        ProductsRepository,
        ProductsService,
    ],
    exports: [
        ProductsRepository,
        ProductsService,
    ],
})
export class ProductsModule { }
