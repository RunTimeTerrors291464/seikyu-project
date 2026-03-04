import { Module } from '@nestjs/common';

// Import modules.
import { UsersModule } from '../users/users.module';

// Import typeorm and entities.
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductsEntity } from './entities/products.entity';
import { ProductUnitsEntity } from './entities/productUnits.entity';
import { ProductNamesEntity } from './entities/productNames.entity';
import { ProductUnitsHistoryEntity } from './entities/history/productUnitsHistory.entity';
import { ProductsHistoryEntity } from './entities/history/productsHistory.entity';
import { ProductStockHistoryEntity } from './entities/history/productStockHistory.entity';
import { ProductOverviewEntity } from './entities/productOverview.entity';

// Import controllers.
import { ProductsController } from './controllers/products.controller';
import { ProductUnitsController } from './controllers/productUnits.controller';

// Import services.
import { ProductsService } from './services/products.service';
import { ProductUnitsService } from './services/productUnits.service';

// Import repositories.
import { ProductsRepository } from './repositories/products.repository';
import { ProductUnitsRepository } from './repositories/productUnits.repository';

// Import mappers.
import { ProductMapper } from '@app/common/mappers/platform/product.mapper';
import { ProductUnitMapper } from '@app/common/mappers/platform/productUnit.mapper';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            ProductsEntity,
            ProductUnitsEntity,
            ProductNamesEntity,
            ProductUnitsHistoryEntity,
            ProductsHistoryEntity,
            ProductStockHistoryEntity,
            ProductOverviewEntity,
        ]),

        UsersModule,
    ],
    controllers: [
        ProductsController,
        ProductUnitsController,
    ],
    providers: [
        ProductsService,
        ProductUnitsService,
        ProductsRepository,
        ProductUnitsRepository,
        ProductMapper,
        ProductUnitMapper,
    ],
    exports: []
})
export class ProductsModule { }
